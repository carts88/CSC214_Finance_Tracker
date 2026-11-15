import { addDays, addMonths, format, parse } from "date-fns";
import type { Frequency } from "#/database/schemas.recurrence";

/**
 * Date math for repeating incomes/expenses. A repeating entry is stored as ONE
 * database row; these helpers work out the individual dates it happens on.
 *
 * All dates are 'YYYY-MM-DD' strings. Strings in that format sort the same
 * way as the dates they represent, so we can compare them with < and >.
 */

/** The fields a row needs for the helpers below (works for any table). */
export interface RepeatingEntry {
	occurred_on: string;
	frequency: Frequency;
	end_date: string | null;
}

/** How far apart two occurrences are, for each frequency. */
const STEP: Record<Frequency, { days: number } | { months: number } | null> = {
	never: null,
	daily: { days: 1 },
	weekly: { days: 7 },
	biweekly: { days: 14 },
	monthly: { months: 1 },
	every_2_months: { months: 2 },
	every_3_months: { months: 3 },
	every_4_months: { months: 4 },
	every_6_months: { months: 6 },
	yearly: { months: 12 },
};

const toDate = (value: string) => parse(value, "yyyy-MM-dd", new Date());
const toText = (date: Date) => format(date, "yyyy-MM-dd");

/** Today's date as 'YYYY-MM-DD' (in the viewer's timezone). */
export const today = () => toText(new Date());

/**
 * The n-th occurrence of an entry (n = 0 is the first one).
 *
 * We always count from the start date instead of adding one step at a time,
 * so a series that starts on Jan 31 goes Jan 31, Feb 28, Mar 31 ... rather
 * than getting stuck on the 28th.
 */
function nthOccurrence(entry: RepeatingEntry, n: number): string {
	const step = STEP[entry.frequency];
	if (!step) return entry.occurred_on;
	const start = toDate(entry.occurred_on);
	return toText(
		"days" in step
			? addDays(start, n * step.days)
			: addMonths(start, n * step.months),
	);
}

/** Every date the entry happens on between `from` and `to` (inclusive). */
export function occurrencesBetween(
	entry: RepeatingEntry,
	from: string,
	to: string,
): string[] {
	if (entry.frequency === "never") {
		const inRange = entry.occurred_on >= from && entry.occurred_on <= to;
		return inRange ? [entry.occurred_on] : [];
	}

	// Stop at whichever comes first: the end of the range or the series' end.
	const last = entry.end_date && entry.end_date < to ? entry.end_date : to;

	const dates: string[] = [];
	for (let n = 0; ; n++) {
		const date = nthOccurrence(entry, n);
		if (date > last) break;
		if (date >= from) dates.push(date);
	}
	return dates;
}

/**
 * The next time a repeating entry happens, on or after today. Returns null
 * for one-off entries and for series that have already ended.
 */
export function nextOccurrence(entry: RepeatingEntry): string | null {
	if (entry.frequency === "never") return null;

	const now = today();
	for (let n = 0; ; n++) {
		const date = nthOccurrence(entry, n);
		if (entry.end_date && date > entry.end_date) return null;
		if (date >= now) return date;
	}
}
