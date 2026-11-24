// Kept free of database imports so client components can use these too.

/** How spending is bucketed in time. Each is a valid Postgres date_trunc unit. */
export const GRANULARITIES = ["week", "month", "quarter", "year"] as const;
export type Granularity = (typeof GRANULARITIES)[number];

/** How many periods back (including the current one) the page can show. */
export const PERIOD_COUNTS = [1, 3, 6, 12] as const;
export type PeriodCount = (typeof PERIOD_COUNTS)[number];

/**
 * How many periods past the current one to project, from repeating (and
 * future-dated) incomes and expenses. 0 turns projection off.
 */
export const PROJECTION_COUNTS = [0, 3, 6, 12] as const;
export type ProjectionCount = (typeof PROJECTION_COUNTS)[number];

export const DEFAULT_GRANULARITY: Granularity = "month";
export const DEFAULT_PERIOD_COUNT: PeriodCount = 6;
export const DEFAULT_PROJECTION_COUNT: ProjectionCount = 3;

/**
 * The length of one period as a Postgres interval. Postgres has no
 * `'1 quarter'` interval literal, so quarters are three months.
 */
export const GRANULARITY_STEP: Record<Granularity, string> = {
	week: "1 week",
	month: "1 month",
	quarter: "3 months",
	year: "1 year",
};
