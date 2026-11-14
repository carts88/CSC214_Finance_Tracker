import { z } from "zod";
import {
	recurrenceFields,
	refineRecurrence,
} from "#/database/schemas.recurrence";

/**
 * The editable fields of an income. Shared by the income form (client-side
 * validation) and the income server fns (server-side validation).
 *
 * A repeating income (frequency other than 'never') is one row standing for
 * the whole series: it recurs from `occurredOn` until `endDate`, or forever.
 * Frequency options: FREQUENCIES in #/database/schemas.recurrence.
 */
export const incomeValuesSchema = refineRecurrence(
	z.object({
		/** Whole cents, e.g. $12.50 -> 1250. */
		amount: z
			.number()
			.int()
			.positive("Enter an amount greater than $0")
			.max(Number.MAX_SAFE_INTEGER),
		/** Calendar date as 'YYYY-MM-DD' (first occurrence if repeating). */
		occurredOn: z.iso.date("Pick a date"),
		source: z
			.string()
			.trim()
			.min(1, "Pick a source")
			.max(100, "Keep the source under 100 characters"),
		...recurrenceFields,
	}),
);

export type IncomeValues = z.input<typeof incomeValuesSchema>;

/** Suggested sources for the income form's dropdown. */
export const INCOME_SOURCES = [
	"Salary",
	"Freelance",
	"Investment",
	"Gift",
	"Other",
] as const;
