import { getSql } from "#/db";
/**
 * Row shape returned by the expense queries.
 * - `amount` is whole cents (BIGINT). Neon returns BIGINT as a string, so the
 *   queries cast it to float8 (exact for any realistic cents value) so it
 *   arrives here as a JS number.
 * - `occurred_on` is a DATE, returned as 'YYYY-MM-DD' text so it isn't shifted
 *   by the server's timezone when parsed into a JS Date.
 */
export interface ExpenseRow {
	id: string;
	amount: number;
	occurred_on: string;
	category: string;
	description: string | null;
	created_at: string;
}

interface IExpenseAccount {
	accountId: string;
}

interface IExpenseValues {
	/** Whole cents, e.g. $12.50 -> 1250. Must be > 0. */
	amount: number;
	/** Calendar date as 'YYYY-MM-DD'. */
	occurredOn: string;
	category: string;
	description?: string | null;
}

/**
 * Retrieves all expenses for a given finance account, newest first.
 * @param accountId the finance account these expenses belong to
 * @returns the account's expenses
 */
export const getUserExpenses = async ({
	accountId,
}: IExpenseAccount): Promise<ExpenseRow[]> => {
	const sql = getSql();
	return (await sql`
		SELECT
			e.id
			, e.amount::float8 AS amount
			, e.occurred_on::text AS occurred_on
			, e.category
			, e.description
			, e.created_at
		FROM expenses e
		WHERE e.account_id = ${accountId}
		ORDER BY e.occurred_on DESC, e.created_at DESC
	`) as ExpenseRow[];
};

/**
 * Creates an expense, or updates it when `expenseId` is given and already
 * exists. An update only applies if the expense belongs to `accountId`, so one
 * account can't overwrite another account's expense.
 *
 * @param accountId the finance account the expense belongs to
 * @param expenseId optional id of an existing expense to update
 * @param amount whole cents
 * @param occurredOn 'YYYY-MM-DD'
 * @param category the expense category
 * @param description optional free-text description
 * @returns the saved expense, or null if `expenseId` belongs to another account
 */
export const upsertUserExpense = async ({
	accountId,
	expenseId,
	amount,
	occurredOn,
	category,
	description = null,
}: IExpenseAccount &
	IExpenseValues & { expenseId?: string }): Promise<ExpenseRow | null> => {
	const sql = getSql();
	const rows = (await sql`
		INSERT INTO expenses (id, account_id, amount, occurred_on, category, description)
		VALUES (
			COALESCE(${expenseId ?? null}::uuid, gen_random_uuid())
			, ${accountId}
			, ${amount}
			, ${occurredOn}::date
			, ${category}
			, ${description}
		)
		ON CONFLICT (id) DO UPDATE SET
			amount = EXCLUDED.amount
			, occurred_on = EXCLUDED.occurred_on
			, category = EXCLUDED.category
			, description = EXCLUDED.description
		WHERE expenses.account_id = EXCLUDED.account_id
		RETURNING
			id
			, amount::float8 AS amount
			, occurred_on::text AS occurred_on
			, category
			, description
			, created_at
	`) as ExpenseRow[];
	return rows[0] ?? null;
};

/**
 * Deletes an expense from a given finance account.
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
		RETURNING
			id
			, amount::float8 AS amount
			, occurred_on::text AS occurred_on
			, category
			, description
			, created_at
	`) as ExpenseRow[];
	return rows[0] ?? null;
};
