import type { Frequency } from "#/database/schemas.recurrence";
import { getSql } from "#/db";

/**
 * Row shape returned by the expense queries.
 * - `amount` is whole cents (BIGINT). Neon returns BIGINT as a string, so the
 *   queries cast it to float8 (exact for any realistic cents value) so it
 *   arrives here as a JS number.
 * - Dates are returned as 'YYYY-MM-DD' text so they aren't shifted by the
 *   server's timezone when parsed into a JS Date.
 * - A row with `frequency` other than 'never' is a whole series: it repeats
 *   from `occurred_on` until `end_date` (null = forever). See
 *   db/002_recurring.sql.
 */
export interface ExpenseRow {
	id: string;
	amount: number;
	/** The date of a one-off expense, or the first occurrence of a series. */
	occurred_on: string;
	category: string;
	description: string | null;
	frequency: Frequency;
	/** Last date a series can occur on; null for one-offs and open series. */
	end_date: string | null;
	/** Next occurrence on or after today, or null if none is left. */
	next_occurrence: string | null;
	/**
	 * The loan this expense pays (db/006_loan_payments_as_expenses.sql), or
	 * null. When set, `category` is the loan's name.
	 */
	loan_id: string | null;
	created_at: string;
}

/** One dated occurrence of an expense, with series expanded. */
export interface ExpenseOccurrenceRow {
	id: string;
	amount: number;
	occurred_on: string;
	category: string;
	description: string | null;
}

/**
 * The SELECT/RETURNING list that produces an `ExpenseRow`. Columns are
 *
 * next_occurrence: occurrence k is occurred_on + k * step, computed from
 * occurred_on each time so month-end dates don't drift. The generate_series
 * bound is one past the most steps that fit before today, so the first
 * occurrence >= today is always included. For 'never' the bound is NULL, the
 * series is empty, and next_occurrence is NULL.
 */
export const EXPENSE_COLUMNS = `
	id
	, amount::float8 AS amount
	, occurred_on::text AS occurred_on
	, category
	, description
	, frequency
	, end_date::text AS end_date
	, (
		SELECT min(o.on_date)::text
		FROM (
			SELECT (occurred_on + k.n * recurrence_step(frequency))::date AS on_date
			FROM generate_series(
				0,
				(GREATEST(current_date, occurred_on) - occurred_on)
					/ recurrence_min_days(frequency) + 1
			) AS k(n)
		) o
		WHERE o.on_date >= current_date
			AND (end_date IS NULL OR o.on_date <= end_date)
	) AS next_occurrence
	, loan_id
	, created_at
`;

interface IExpenseAccount {
	accountId: string;
}

interface IExpenseValues {
	/** Whole cents, e.g. $12.50 -> 1250. Must be > 0. */
	amount: number;
	/** Calendar date as 'YYYY-MM-DD' (first occurrence if repeating). */
	occurredOn: string;
	category: string;
	description?: string | null;
	frequency: Frequency;
	/** 'YYYY-MM-DD', or null for no end. Only allowed when repeating. */
	endDate?: string | null;
	/**
	 * The loan this expense pays, or null. When set, the loan's name is saved
	 * as the category (whatever `category` says), so each loan is its own
	 * category in reports.
	 */
	loanId?: string | null;
}

/**
 * Retrieves all expenses for a given finance account, newest first. A
 * recurring expense comes back as one row for the whole series.
 * @param accountId the finance account these expenses belong to
 * @returns the account's expenses
 */
export const getUserExpenses = async ({
	accountId,
}: IExpenseAccount): Promise<ExpenseRow[]> => {
	const sql = getSql();
	return (await sql`
		SELECT ${sql.unsafe(EXPENSE_COLUMNS)}
		FROM expenses
		WHERE account_id = ${accountId}
		ORDER BY occurred_on DESC, created_at DESC
	`) as ExpenseRow[];
};

/**
 * Creates an expense, or updates it when `expenseId` is given and already
 * exists. An update only applies if the expense belongs to `accountId`, so one
 * account can't overwrite another account's expense. Updating a recurring
 * expense changes the whole series.
 *
 * @param accountId the finance account the expense belongs to
 * @param expenseId optional id of an existing expense to update
 * @param amount whole cents
 * @param occurredOn 'YYYY-MM-DD' (first occurrence if repeating)
 * @param category the expense category
 * @param description optional free-text description
 * @param frequency 'never' for a one-off, otherwise how often it repeats
 * @param endDate optional last date a repeating expense can occur on
 * @param loanId optional loan this expense pays; its name becomes the category
 * @returns the saved expense, or null if `expenseId` belongs to another
 *   account or `loanId` isn't a loan on this account
 */
export const upsertUserExpense = async ({
	accountId,
	expenseId,
	amount,
	occurredOn,
	category,
	description = null,
	frequency,
	endDate = null,
	loanId = null,
}: IExpenseAccount &
	IExpenseValues & { expenseId?: string }): Promise<ExpenseRow | null> => {
	const sql = getSql();
	// `loan` is the loan's row when `loanId` names one on this account. The
	// WHERE skips the insert entirely if `loanId` is set but doesn't match.
	const rows = (await sql`
		INSERT INTO expenses (id, account_id, amount, occurred_on, category, description, frequency, end_date, loan_id)
		SELECT
			COALESCE(${expenseId ?? null}::uuid, gen_random_uuid())
			, ${accountId}
			, ${amount}
			, ${occurredOn}::date
			, COALESCE(left(loan.name, 100), ${category})
			, ${description}
			, ${frequency}::recurrence_frequency
			, ${endDate}::date
			, loan.id
		FROM (SELECT 1) AS one
		LEFT JOIN loans AS loan
			ON loan.id = ${loanId}::uuid AND loan.account_id = ${accountId}
		WHERE ${loanId}::uuid IS NULL OR loan.id IS NOT NULL
		ON CONFLICT (id) DO UPDATE SET
			amount = EXCLUDED.amount
			, occurred_on = EXCLUDED.occurred_on
			, category = EXCLUDED.category
			, description = EXCLUDED.description
			, frequency = EXCLUDED.frequency
			, end_date = EXCLUDED.end_date
			, loan_id = EXCLUDED.loan_id
		WHERE expenses.account_id = EXCLUDED.account_id
		RETURNING ${sql.unsafe(EXPENSE_COLUMNS)}
	`) as ExpenseRow[];
	return rows[0] ?? null;
};

/**
 * Stops a recurring expense: sets its end date to today (or its start date if
 * it hasn't started yet), so today's occurrence is the last one. Past
 * occurrences are kept.
 *
 * @param accountId the finance account the expense belongs to
 * @param expenseId the recurring expense to stop
 * @returns the updated expense, or null if it isn't an active recurring
 *   expense on this account
 */
export const stopRecurringExpense = async ({
	accountId,
	expenseId,
}: IExpenseAccount & { expenseId: string }): Promise<ExpenseRow | null> => {
	const sql = getSql();
	const rows = (await sql`
		UPDATE expenses
		SET end_date = GREATEST(occurred_on, current_date)
		WHERE account_id = ${accountId}
			AND id = ${expenseId}
			AND frequency <> 'never'
			AND (end_date IS NULL OR end_date > current_date)
		RETURNING ${sql.unsafe(EXPENSE_COLUMNS)}
	`) as ExpenseRow[];
	return rows[0] ?? null;
};

/**
 * Deletes an expense from a given finance account. Deleting a recurring
 * expense removes the whole series.
 *
 * @param accountId the finance account the expense belongs to
 * @param expenseId the expense to delete
 * @returns the deleted expense, or null if it didn't exist on this account
 */
export const removeUserExpense = async ({
	accountId,
	expenseId,
}: IExpenseAccount & { expenseId: string }): Promise<ExpenseRow | null> => {
	const sql = getSql();
	const rows = (await sql`
		DELETE FROM expenses
		WHERE account_id = ${accountId} AND id = ${expenseId}
		RETURNING ${sql.unsafe(EXPENSE_COLUMNS)}
	`) as ExpenseRow[];
	return rows[0] ?? null;
};

/**
 * Deletes several expenses from a given finance account in one statement.
 * Ids that don't exist on this account are skipped.
 *
 * @param accountId the finance account the expenses belong to
 * @param expenseIds the expenses to delete
 * @returns the deleted expenses
 */
export const removeUserExpenses = async ({
	accountId,
	expenseIds,
}: IExpenseAccount & { expenseIds: string[] }): Promise<ExpenseRow[]> => {
	const sql = getSql();
	return (await sql`
		DELETE FROM expenses
		WHERE account_id = ${accountId} AND id = ANY(${expenseIds}::uuid[])
		RETURNING ${sql.unsafe(EXPENSE_COLUMNS)}
	`) as ExpenseRow[];
};
