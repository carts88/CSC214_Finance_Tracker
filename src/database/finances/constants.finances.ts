// Kept free of database imports so client components can use these too.

/** Look-ahead windows, in days, for the scheduled-expense totals. */
export const SCHEDULE_WINDOWS = [7, 30, 90] as const;

export type ScheduleWindow = (typeof SCHEDULE_WINDOWS)[number];

/** Summary column holding a window's total, e.g. 'next_30_days'. */
export type ScheduleWindowKey = `next_${ScheduleWindow}_days`;

export function scheduleWindowKey(days: ScheduleWindow): ScheduleWindowKey {
	return `next_${days}_days`;
}

/** How many days ahead the upcoming-expenses list reaches. */
export const UPCOMING_DAYS = 30;
