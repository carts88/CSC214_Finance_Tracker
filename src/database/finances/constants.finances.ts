// Kept free of database imports so client components can use these too.

/** Look-ahead windows, in days, for the scheduled income/expense totals. */
export const SCHEDULE_WINDOWS = [7, 30, 90] as const;

export type ScheduleWindow = (typeof SCHEDULE_WINDOWS)[number];

/** Which side of the ledger a scheduled total covers. */
export type ScheduleKind = "income" | "expense";

/** Summary column holding a window's total, e.g. 'expense_next_30_days'. */
export type ScheduleWindowKey = `${ScheduleKind}_next_${ScheduleWindow}_days`;

export function scheduleWindowKey(
	kind: ScheduleKind,
	days: ScheduleWindow,
): ScheduleWindowKey {
	return `${kind}_next_${days}_days`;
}

/** How many days ahead the upcoming income/expense lists reach. */
export const UPCOMING_DAYS = 30;
