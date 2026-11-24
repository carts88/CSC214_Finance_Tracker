import {
	occurrencesThrough,
	type SqlFragment,
} from "#/database/finances/queries.finances";
import {
	GRANULARITY_STEP,
	type Granularity,
} from "#/database/reports/constants.reports";
import { getSql } from "#/db";

/**
 * Report aggregates: income, expenses and net worth grouped by time period,
 * plus income by source and expenses by category. Money is whole cents cast
 * to float8 so it arrives as a JS number; dates are 'YYYY-MM-DD' text (see
 * ExpenseRow).
 *
 * Periods up to and including the current one count only occurrences up to
 * and including today: a recurring income or expense counts once each time
 * it has happened (the same rule as the dashboard). Projected periods, after
 * the current one, count the occurrences scheduled in them: every future
 * occurrence of a repeating item, plus any one-off dated in the future.
 */

interface RangeArgs {
	accountId: string;
	granularity: Granularity;
	/** Number of periods, counting the current (partial) one. */
	periodCount: number;
	/** Number of projected periods after the current one; 0 for none. */
	projectionCount: number;
}

/** Tables that are grouped by a label: incomes by source, expenses by category. */
type FlowTable = "incomes" | "expenses";
const LABEL_COLUMN: Record<FlowTable, string> = {
	incomes: "source",
	expenses: "category",
};

/** First day of the oldest period in range, as an SQL date expression. */
function rangeStart({ granularity, periodCount }: RangeArgs): SqlFragment {
	const sql = getSql();
	return sql`(
		date_trunc(${granularity}, current_date::timestamp)
		- ${periodCount - 1}::int * ${GRANULARITY_STEP[granularity]}::interval
	)::date`;
}

/** First day of the first projected period (the one after the current). */
function projectionStart({ granularity }: RangeArgs): SqlFragment {
	const sql = getSql();
	return sql`(
		date_trunc(${granularity}, current_date::timestamp)
		+ ${GRANULARITY_STEP[granularity]}::interval
	)::date`;
}

/**
 * Last day anything is counted: the last projected period's last day, or
 * today when not projecting.
 */
function rangeEnd({ granularity, projectionCount }: RangeArgs): SqlFragment {
	const sql = getSql();
	if (projectionCount === 0) return sql`current_date`;
	return sql`(
		date_trunc(${granularity}, current_date::timestamp)
		+ ${projectionCount + 1}::int * ${GRANULARITY_STEP[granularity]}::interval
		- interval '1 day'
	)::date`;
}

/**
 * Every period in range, oldest first, then the projected ones. Columns:
 * period_start; as_of: the period's last day, or today for the current
 * period; projected: true for periods after the current one.
 */
function periods(args: RangeArgs): SqlFragment {
	const sql = getSql();
	const step = GRANULARITY_STEP[args.granularity];
	return sql`
		SELECT
			period_start
			, CASE WHEN projected THEN period_end
				ELSE LEAST(period_end, current_date)
			END AS as_of
			, projected
		FROM (
			SELECT
				p::date AS period_start
				, (p + ${step}::interval - interval '1 day')::date AS period_end
				, p::date >= ${projectionStart(args)} AS projected
			FROM generate_series(
				${rangeStart(args)}::timestamp
				, date_trunc(${args.granularity}, current_date::timestamp)
					+ ${args.projectionCount}::int * ${step}::interval
				, ${step}::interval
			) AS p
		) p
	`;
}

/**
 * One row per income or expense occurrence in range, tagged with the first
 * day of its period. Columns: period_start, on_date, name (source or
 * category), amount. Occurrences after today in the current period are left
 * out (they haven't happened yet); ones in projected periods are kept.
 *
 * period_start is computed here rather than in the GROUP BY because each
 * interpolated value becomes its own bind parameter: `GROUP BY
 * date_trunc($5, ...)` wouldn't match `SELECT date_trunc($2, ...)`.
 */
function inRange(table: FlowTable, args: RangeArgs): SqlFragment {
	const sql = getSql();
	return sql`
		SELECT
			date_trunc(${args.granularity}, on_date::timestamp)::date AS period_start
			, on_date
			, ${sql.unsafe(LABEL_COLUMN[table])} AS name
			, amount
		FROM (${occurrencesThrough(table, args.accountId, rangeEnd(args))}) o
		WHERE on_date >= ${rangeStart(args)}
			AND (on_date <= current_date OR on_date >= ${projectionStart(args)})
	`;
}

/** Totals per (period, source/category) pair. */
function byPeriodAndNameQuery(table: FlowTable, args: RangeArgs) {
	const sql = getSql();
	return sql`
		SELECT
			period_start::text AS period_start
			, name
			, SUM(amount)::float8 AS amount
			, count(*)::int AS count
		FROM (${inRange(table, args)}) r
		GROUP BY period_start, name
		ORDER BY period_start, amount DESC, name
	`;
}

/** Totals per source/category across the whole range, up to today only. */
function byNameQuery(table: FlowTable, args: RangeArgs) {
	const sql = getSql();
	return sql`
		SELECT
			name
			, SUM(amount)::float8 AS amount
			, count(*)::int AS count
		FROM (${inRange(table, args)}) r
		WHERE on_date <= current_date
		GROUP BY name
		ORDER BY amount DESC, name
	`;
}

/**
 * Net worth at the end of each period (or today, for the current one), with
 * every period in range even if nothing happened in it.
 *
 * Net worth = all income to date - all expenses to date + assets acquired by
 * then, the same formula as the dashboard. Each period joins to every money
 * movement on or before its as_of date and the GROUP BY sums them up.
 * There's no history of asset values, so an asset counts at its current
 * value from the day it was acquired, and a sold asset (deleted, with its
 * sale price recorded as income) only shows up as that income. Projected
 * periods add the scheduled occurrences and keep assets at today's value.
 */
function netWorthQuery(args: RangeArgs) {
	const sql = getSql();
	return sql`
		WITH periods AS (${periods(args)})
		, flows AS (
			SELECT on_date, amount AS delta, false AS is_asset
			FROM (${occurrencesThrough("incomes", args.accountId, rangeEnd(args))}) i
			UNION ALL
			SELECT on_date, -amount, false
			FROM (${occurrencesThrough("expenses", args.accountId, rangeEnd(args))}) e
			UNION ALL
			SELECT acquired_on, value, true
			FROM assets
			WHERE account_id = ${args.accountId}
		)
		SELECT
			p.period_start::text AS period_start
			, p.as_of::text AS as_of
			, p.projected
			, COALESCE(SUM(f.delta) FILTER (WHERE NOT f.is_asset), 0)::float8 AS cash
			, COALESCE(SUM(f.delta) FILTER (WHERE f.is_asset), 0)::float8 AS assets
			, COALESCE(SUM(f.delta), 0)::float8 AS net_worth
		FROM periods p
		LEFT JOIN flows f ON f.on_date <= p.as_of
		GROUP BY p.period_start, p.as_of, p.projected
		ORDER BY p.period_start
	`;
}

/** A source (incomes) or category (expenses) and its total. */
export interface BreakdownRow {
	name: string;
	/** Whole cents. */
	amount: number;
	/** How many income/expense occurrences make up the amount. */
	count: number;
}

interface PeriodBreakdownRow extends BreakdownRow {
	period_start: string;
}

interface NetWorthRow {
	period_start: string;
	as_of: string;
	projected: boolean;
	cash: number;
	assets: number;
	net_worth: number;
}

export interface ReportPeriod {
	/** First day of the period, 'YYYY-MM-DD'. */
	periodStart: string;
	/** Day the balances are taken: the period's last day, or today. */
	asOf: string;
	/**
	 * After the current period: amounts are what's scheduled (repeating and
	 * future-dated items), not what happened.
	 */
	projected: boolean;
	/** Whole cents earned in the period. */
	income: number;
	/** Whole cents spent in the period. */
	expense: number;
	/** Net worth on `asOf`: cash + assets. */
	netWorth: number;
	/** All income minus all expenses up to `asOf`. */
	cash: number;
	/** Value of the assets held on `asOf`. */
	assets: number;
	/** Largest first. */
	incomeSources: BreakdownRow[];
	/** Largest first. */
	expenseCategories: BreakdownRow[];
}

export interface Report {
	granularity: Granularity;
	/**
	 * Oldest first; every period in range, even ones where nothing happened,
	 * followed by `projectionCount` projected periods.
	 */
	periods: ReportPeriod[];
	projectionCount: number;
	/** Totals over the range up to today (not projected), largest first. */
	incomeSources: BreakdownRow[];
	expenseCategories: BreakdownRow[];
	/** Whole cents over the range up to today. */
	totalIncome: number;
	totalExpense: number;
}

/**
 * Income, expenses and net worth for a finance account, grouped by time
 * period and by source/category, optionally projected forward. The queries run in one read-only
 * transaction so they all see the same snapshot.
 */
export async function getReport(args: RangeArgs): Promise<Report> {
	const sql = getSql();
	const [
		netWorthRows,
		incomeByPeriod,
		incomeSources,
		expenseByPeriod,
		expenseCategories,
	] = (await sql.transaction(
		[
			netWorthQuery(args),
			byPeriodAndNameQuery("incomes", args),
			byNameQuery("incomes", args),
			byPeriodAndNameQuery("expenses", args),
			byNameQuery("expenses", args),
		],
		{ readOnly: true },
	)) as [
		NetWorthRow[],
		PeriodBreakdownRow[],
		BreakdownRow[],
		PeriodBreakdownRow[],
		BreakdownRow[],
	];

	const periods = new Map<string, ReportPeriod>(
		netWorthRows.map((row) => [
			row.period_start,
			{
				periodStart: row.period_start,
				asOf: row.as_of,
				projected: row.projected,
				income: 0,
				expense: 0,
				netWorth: row.net_worth,
				cash: row.cash,
				assets: row.assets,
				incomeSources: [],
				expenseCategories: [],
			},
		]),
	);
	for (const { period_start, ...row } of incomeByPeriod) {
		const period = periods.get(period_start);
		if (!period) continue;
		period.incomeSources.push(row);
		period.income += row.amount;
	}
	for (const { period_start, ...row } of expenseByPeriod) {
		const period = periods.get(period_start);
		if (!period) continue;
		period.expenseCategories.push(row);
		period.expense += row.amount;
	}

	const sum = (rows: BreakdownRow[]) =>
		rows.reduce((total, row) => total + row.amount, 0);
	return {
		granularity: args.granularity,
		periods: [...periods.values()],
		projectionCount: args.projectionCount,
		incomeSources,
		expenseCategories,
		totalIncome: sum(incomeSources),
		totalExpense: sum(expenseCategories),
	};
}
