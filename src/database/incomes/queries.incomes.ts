import type { Frequency } from "#/database/schemas.recurrence";
import { getSql } from "#/db";

/**
 * Row shape returned by the income queries.
 * - `amount` is whole cents (BIGINT). Neon returns BIGINT as a string, so the
 *   queries cast it to float8 (exact for any realistic cents value) so it
 *   arrives here as a JS number.
 * - Dates are returned as 'YYYY-MM-DD' text so they aren't shifted by the
 *   server's timezone when parsed into a JS Date.
 * - A row with `frequency` other than 'never' is a whole series: it repeats
 *   from `occurred_on` until `end_date` (null = forever). See
 *   db/002_recurring.sql.
 */
export interface IncomeRow {
	id: string;
	amount: number;
	/** The date of a one-off income, or the first occurrence of a series. */
	occurred_on: string;
	source: string;
	frequency: Frequency;
	/** Last date a series can occur on; null for one-offs and open series. */
	end_date: string | null;
	/** Next occurrence on or after today, or null if none is left. */
	next_occurrence: string | null;
	created_at: string;
}

/**
 * The SELECT/RETURNING list that produces an `IncomeRow`. Columns are
 * unqualified so it works in both `SELECT ... FROM incomes` and `RETURNING`.
 *
 * next_occurrence: occurrence k is occurred_on + k * step, computed from
 * occurred_on each time so month-end dates don't drift. The generate_series
 * bound is one past the most steps that fit before today, so the first
 * occurrence >= today is always included. For 'never' the bound is NULL, the
 * series is empty, and next_occurrence is NULL.
 */
export const INCOME_COLUMNS = `
	id
	, amount::float8 AS amount
	, occurred_on::text AS occurred_on
	, source
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
	, created_at
`;

interface IIncomeAccount {
	accountId: string;
}

interface IIncomeValues {
	/** Whole cents, e.g. $12.50 -> 1250. Must be > 0. */
	amount: number;
	/** Calendar date as 'YYYY-MM-DD' (first occurrence if repeating). */
	occurredOn: string;
	source: string;
	frequency: Frequency;
	/** 'YYYY-MM-DD', or null for no end. Only allowed when repeating. */
	endDate?: string | null;
}

/**
 * Retrieves all incomes for a given finance account, newest first. A
 * recurring income comes back as one row for the whole series.
 * @param accountId the finance account these incomes belong to
 * @returns the account's incomes
 */
export const getUserIncomes = async ({
	accountId,
}: IIncomeAccount): Promise<IncomeRow[]> => {
	const sql = getSql();
	return (await sql`
		SELECT ${sql.unsafe(INCOME_COLUMNS)}
		FROM incomes
		WHERE account_id = ${accountId}
		ORDER BY occurred_on DESC, created_at DESC
	`) as IncomeRow[];
};

/**
 * Creates an income, or updates it when `incomeId` is given and already
 * exists. An update only applies if the income belongs to `accountId`, so one
 * account can't overwrite another account's income. Updating a recurring
 * income changes the whole series.
 *
 * @param accountId the finance account the income belongs to
 * @param incomeId optional id of an existing income to update
 * @param amount whole cents
 * @param occurredOn 'YYYY-MM-DD' (first occurrence if repeating)
 * @param source where the income came from
 * @param frequency 'never' for a one-off, otherwise how often it repeats
 * @param endDate optional last date a repeating income can occur on
 * @returns the saved income, or null if `incomeId` belongs to another account
 */
export const upsertUserIncome = async ({
	accountId,
	incomeId,
	amount,
	occurredOn,
	source,
	frequency,
	endDate = null,
}: IIncomeAccount &
	IIncomeValues & { incomeId?: string }): Promise<IncomeRow | null> => {
	const sql = getSql();
	const rows = (await sql`
		INSERT INTO incomes (id, account_id, amount, occurred_on, source, frequency, end_date)
		VALUES (
			COALESCE(${incomeId ?? null}::uuid, gen_random_uuid())
			, ${accountId}
			, ${amount}
			, ${occurredOn}::date
			, ${source}
			, ${frequency}::recurrence_frequency
			, ${endDate}::date
		)
		ON CONFLICT (id) DO UPDATE SET
			amount = EXCLUDED.amount
			, occurred_on = EXCLUDED.occurred_on
			, source = EXCLUDED.source
			, frequency = EXCLUDED.frequency
			, end_date = EXCLUDED.end_date
		WHERE incomes.account_id = EXCLUDED.account_id
		RETURNING ${sql.unsafe(INCOME_COLUMNS)}
	`) as IncomeRow[];
	return rows[0] ?? null;
};

/**
 * Stops a recurring income: sets its end date to today (or its start date if
 * it hasn't started yet), so today's occurrence is the last one. Past
 * occurrences are kept.
 *
 * @param accountId the finance account the income belongs to
 * @param incomeId the recurring income to stop
 * @returns the updated income, or null if it isn't an active recurring
 *   income on this account
 */
export const stopRecurringIncome = async ({
	accountId,
	incomeId,
}: IIncomeAccount & { incomeId: string }): Promise<IncomeRow | null> => {
	const sql = getSql();
	const rows = (await sql`
		UPDATE incomes
		SET end_date = GREATEST(occurred_on, current_date)
		WHERE account_id = ${accountId}
			AND id = ${incomeId}
			AND frequency <> 'never'
			AND (end_date IS NULL OR end_date > current_date)
		RETURNING ${sql.unsafe(INCOME_COLUMNS)}
	`) as IncomeRow[];
	return rows[0] ?? null;
};

/**
 * Deletes an income from a given finance account. Deleting a recurring
 * income removes the whole series.
 *
 * @param accountId the finance account the income belongs to
 * @param incomeId the income to delete
 * @returns the deleted income, or null if it didn't exist on this account
 */
export const removeUserIncome = async ({
	accountId,
	incomeId,
}: IIncomeAccount & { incomeId: string }): Promise<IncomeRow | null> => {
	const sql = getSql();
	const rows = (await sql`
		DELETE FROM incomes
		WHERE account_id = ${accountId} AND id = ${incomeId}
		RETURNING ${sql.unsafe(INCOME_COLUMNS)}
	`) as IncomeRow[];
	return rows[0] ?? null;
};

/**
 * Deletes several incomes from a given finance account in one statement.
 * Ids that don't exist on this account are skipped.
 *
 * @param accountId the finance account the incomes belong to
 * @param incomeIds the incomes to delete
 * @returns the deleted incomes
 */
export const removeUserIncomes = async ({
	accountId,
	incomeIds,
}: IIncomeAccount & { incomeIds: string[] }): Promise<IncomeRow[]> => {
	const sql = getSql();
	return (await sql`
		DELETE FROM incomes
		WHERE account_id = ${accountId} AND id = ANY(${incomeIds}::uuid[])
		RETURNING ${sql.unsafe(INCOME_COLUMNS)}
	`) as IncomeRow[];
};
