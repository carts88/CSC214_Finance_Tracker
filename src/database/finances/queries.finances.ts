import {
	EXPENSE_COLUMNS,
	type ExpenseRow,
} from "#/database/expenses/queries.expenses";
import {
	SCHEDULE_WINDOWS,
	type ScheduleKind,
	type ScheduleWindowKey,
	scheduleWindowKey,
	UPCOMING_DAYS,
} from "#/database/finances/constants.finances";
import type { Frequency } from "#/database/schemas.recurrence";
import { getSql } from "#/db";

/**
 * Dashboard aggregates. All money is whole cents, cast to float8 so it arrives
 * as a JS number (see ExpenseRow). Dates are 'YYYY-MM-DD' text.
 *
 * The queries are assembled from reusable fragments:
 * - Fragments that carry values (account id, date bounds) are nested `sql`
 *   templates, so their values stay bound parameters.
 * - Fixed SQL text (column lists, CASE expressions, a table name from a closed
 *   union) goes in with `sql.unsafe`. Never pass user input to `sql.unsafe`.
 */

/** A composable `sql` template that hasn't been run yet. */
type SqlFragment = ReturnType<ReturnType<typeof getSql>>;

/** Tables whose rows can repeat (`frequency` + `end_date`). */
type RecurringTable = "incomes" | "expenses";

/** First and last day of the current calendar month, as SQL date expressions. */
const MONTH_START = "date_trunc('month', current_date)::date";
const MONTH_END =
	"(date_trunc('month', current_date) + interval '1 month - 1 day')::date";

/**
 * Multiplier that turns one occurrence's amount into a per-month amount,
 * e.g. a weekly $10 is about $43.48/month. Unqualified so it works on any
 * table with a `frequency` column.
 */
const MONTHLY_FACTOR = `
	CASE frequency
		WHEN 'daily'          THEN 30.4375
		WHEN 'weekly'         THEN 30.4375 / 7
		WHEN 'biweekly'       THEN 30.4375 / 14
		WHEN 'monthly'        THEN 1
		WHEN 'every_2_months' THEN 1.0 / 2
		WHEN 'every_3_months' THEN 1.0 / 3
		WHEN 'every_4_months' THEN 1.0 / 4
		WHEN 'every_6_months' THEN 1.0 / 6
		WHEN 'yearly'         THEN 1.0 / 12
		ELSE 0
	END
`;

/**
 * `<kind>_next_7_days, <kind>_next_30_days, ...` columns: the total of
 * occurrences from today up to (not including) today + N days. Built from
 * numeric constants and a closed union only, so `sql.unsafe` is safe here.
 */
function scheduleWindowColumns(kind: ScheduleKind): string {
	return SCHEDULE_WINDOWS.map(
		(days) => `
		COALESCE(SUM(amount) FILTER (
			WHERE on_date >= current_date AND on_date < current_date + ${days}
		), 0)::float8 AS ${scheduleWindowKey(kind, days)}`,
	).join(",");
}

/**
 * Every dated occurrence of an account's incomes or expenses up to and
 * including `through` (an SQL date fragment, e.g. sql`current_date + 30`).
 * A one-off row yields itself once; a series yields one row per occurrence.
 * Columns: all of the table's columns plus `on_date`.
 *
 * Occurrence k is occurred_on + k * step, counted from the start every time
 * so month-end dates don't drift (Jan 31 -> Feb 28 -> Mar 31), matching
 * EXPENSE_COLUMNS and lib/utils/helpers/recurrence.ts. recurrence_min_days
 * gives an upper bound on k; the WHERE trims anything past the bounds.
 */
function occurrencesThrough(
	table: RecurringTable,
	accountId: string,
	through: SqlFragment,
): SqlFragment {
	const sql = getSql();
	return sql`
		SELECT t.*, o.on_date
		FROM ${sql.unsafe(table)} t
		CROSS JOIN LATERAL generate_series(
			0,
			CASE WHEN t.frequency = 'never' THEN 0
				ELSE (LEAST(t.end_date, ${through}) - t.occurred_on)
					/ recurrence_min_days(t.frequency)
			END
		) AS k(n)
		CROSS JOIN LATERAL (
			SELECT (
				t.occurred_on
				+ COALESCE(k.n * recurrence_step(t.frequency), interval '0')
			)::date AS on_date
		) o
		WHERE t.account_id = ${accountId}
			AND o.on_date <= ${through}
			AND (t.end_date IS NULL OR o.on_date <= t.end_date)
	`;
}

/**
 * Recurring expenses that still have an occurrence ahead of them, as
 * `SubscriptionRow`s. Shared by the subscriptions list and the summary totals
 * so the two always agree.
 */
function activeSubscriptions(accountId: string): SqlFragment {
	const sql = getSql();
	return sql`
		SELECT *
		FROM (
			SELECT
				${sql.unsafe(EXPENSE_COLUMNS)}
				, (amount * ${sql.unsafe(MONTHLY_FACTOR)})::float8 AS monthly_cost
			FROM expenses
			WHERE account_id = ${accountId}
				AND frequency <> 'never'
		) s
		WHERE next_occurrence IS NOT NULL
	`;
}

/**
 * One row of account totals. Also has `income_next_N_days` and
 * `expense_next_N_days` columns per SCHEDULE_WINDOWS entry: what's scheduled
 * from today up to today + N days.
 */
export interface DashboardSummaryRow extends Record<ScheduleWindowKey, number> {
	/** Every income occurrence up to and including today. */
	income_to_date: number;
	/** Income occurrences anywhere in the current calendar month. */
	income_this_month: number;
	expense_to_date: number;
	expense_this_month: number;
	/** income_to_date - expense_to_date. */
	total_money: number;
	subscription_count: number;
	/** Sum of the active subscriptions' monthly equivalents. */
	subscription_monthly_total: number;
}

/** An active recurring expense, with its cost converted to per-month. */
export interface SubscriptionRow extends ExpenseRow {
	/** Always set for an active subscription. */
	next_occurrence: string;
	monthly_cost: number;
}

/** One upcoming occurrence of an income or expense (series expanded). */
export interface UpcomingRow {
	/** The income/expense row this comes from (not unique per occurrence). */
	id: string;
	on_date: string;
	/** An expense's category or an income's source. */
	label: string;
	/** An expense's description; always null for incomes. */
	description: string | null;
	frequency: Frequency;
	amount: number;
}

function summaryQuery(accountId: string): SqlFragment {
	const sql = getSql();
	// Far enough ahead for both the month end and the longest window.
	const horizon = sql`current_date + ${Math.max(...SCHEDULE_WINDOWS)}::int`;
	return sql`
		WITH inc AS (
			${occurrencesThrough("incomes", accountId, horizon)}
		)
		, exp AS (
			${occurrencesThrough("expenses", accountId, horizon)}
		)
		, inc_totals AS (
			SELECT
				COALESCE(SUM(amount) FILTER (WHERE on_date <= current_date), 0) AS to_date
				, COALESCE(SUM(amount) FILTER (
					WHERE on_date BETWEEN ${sql.unsafe(MONTH_START)} AND ${sql.unsafe(MONTH_END)}
				), 0) AS this_month
				, ${sql.unsafe(scheduleWindowColumns("income"))}
			FROM inc
		)
		, exp_totals AS (
			SELECT
				COALESCE(SUM(amount) FILTER (WHERE on_date <= current_date), 0) AS to_date
				, COALESCE(SUM(amount) FILTER (
					WHERE on_date BETWEEN ${sql.unsafe(MONTH_START)} AND ${sql.unsafe(MONTH_END)}
				), 0) AS this_month
				, ${sql.unsafe(scheduleWindowColumns("expense"))}
			FROM exp
		)
		, subs AS (
			SELECT
				count(*)::int AS n
				, COALESCE(SUM(monthly_cost), 0)::float8 AS monthly_total
			FROM (${activeSubscriptions(accountId)}) a
		)
		SELECT
			i.to_date::float8 AS income_to_date
			, i.this_month::float8 AS income_this_month
			, e.to_date::float8 AS expense_to_date
			, e.this_month::float8 AS expense_this_month
			, (i.to_date - e.to_date)::float8 AS total_money
			, ${sql.unsafe(SCHEDULE_WINDOWS.map((d) => `i.${scheduleWindowKey("income", d)}`).join(", "))}
			, ${sql.unsafe(SCHEDULE_WINDOWS.map((d) => `e.${scheduleWindowKey("expense", d)}`).join(", "))}
			, s.n AS subscription_count
			, s.monthly_total AS subscription_monthly_total
		FROM inc_totals i, exp_totals e, subs s
	`;
}

function subscriptionsQuery(accountId: string): SqlFragment {
	const sql = getSql();
	return sql`
		SELECT *
		FROM (${activeSubscriptions(accountId)}) a
		ORDER BY next_occurrence, category
	`;
}

/** `label`/`description` columns for an UpcomingRow, per table. */
const UPCOMING_LABEL_COLUMNS: Record<RecurringTable, string> = {
	expenses: "category AS label, description",
	incomes: "source AS label, NULL::text AS description",
};

/** Occurrences from today through UPCOMING_DAYS ahead, soonest first. */
function upcomingQuery(table: RecurringTable, accountId: string): SqlFragment {
	const sql = getSql();
	return sql`
		SELECT
			id
			, on_date::text AS on_date
			, ${sql.unsafe(UPCOMING_LABEL_COLUMNS[table])}
			, frequency
			, amount::float8 AS amount
		FROM (
			${occurrencesThrough(table, accountId, sql`current_date + ${UPCOMING_DAYS}::int`)}
		) t
		WHERE on_date >= current_date
		ORDER BY on_date, label
		LIMIT 100
	`;
}

export interface AccountDashboard {
	summary: DashboardSummaryRow;
	subscriptions: SubscriptionRow[];
	upcomingIncomes: UpcomingRow[];
	upcomingExpenses: UpcomingRow[];
}

/**
 * Everything the dashboard shows for one finance account. The queries
 * go in one HTTP round-trip as a read-only transaction, so they all see the
 * same snapshot of the data.
 *
 * @param accountId the finance account to summarise
 */
export const getAccountDashboard = async ({
	accountId,
}: {
	accountId: string;
}): Promise<AccountDashboard> => {
	const sql = getSql();
	const [summary, subscriptions, upcomingIncomes, upcomingExpenses] =
		(await sql.transaction(
			[
				summaryQuery(accountId),
				subscriptionsQuery(accountId),
				upcomingQuery("incomes", accountId),
				upcomingQuery("expenses", accountId),
			],
			{ readOnly: true },
		)) as [
			DashboardSummaryRow[],
			SubscriptionRow[],
			UpcomingRow[],
			UpcomingRow[],
		];
	// The summary aggregates with no GROUP BY, so it always returns one row.
	return {
		summary: summary[0],
		subscriptions,
		upcomingIncomes,
		upcomingExpenses,
	};
};
