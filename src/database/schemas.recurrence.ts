import { z } from "zod";

/**
 * Mirrors the `recurrence_frequency` Postgres enum (db/002_recurring.sql).
 * 'never' = a one-off record; anything else repeats from `occurredOn`.
 */
export const FREQUENCIES = [
	{ value: "never", label: "Does not repeat" },
	{ value: "daily", label: "Daily" },
	{ value: "weekly", label: "Weekly" },
	{ value: "biweekly", label: "Bi-Weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "every_2_months", label: "Every 2 Months" },
	{ value: "every_3_months", label: "Every 3 Months" },
	{ value: "every_4_months", label: "Every 4 Months" },
	{ value: "every_6_months", label: "Every 6 Months" },
	{ value: "yearly", label: "Yearly" },
] as const;

export type Frequency = (typeof FREQUENCIES)[number]["value"];

const FREQUENCY_VALUES = FREQUENCIES.map((f) => f.value) as [
	Frequency,
	...Frequency[],
];

/** Display label for a frequency, e.g. 'biweekly' -> 'Bi-Weekly'. */
export function frequencyLabel(frequency: Frequency): string {
	return FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency;
}

/**
 * Recurrence fields shared by the income and expense schemas. Spread into a
 * `z.object({...})`, then wrap the object with `refineRecurrence`.
 */
export const recurrenceFields = {
	frequency: z.enum(FREQUENCY_VALUES),
	/**
	 * Last date the series can occur on, as 'YYYY-MM-DD', or null for no end.
	 * '' (what an empty DateField holds) also means no end.
	 */
	endDate: z
		.union([z.literal(""), z.iso.date("Pick an end date")])
		.nullish()
		.transform((value) => value || null),
};

/**
 * Cross-field rules for `recurrenceFields`, matching the table CHECK
 * constraint: an end date needs a repeating frequency and can't come before
 * the first occurrence.
 */
export function refineRecurrence<
	T extends z.ZodType<{
		occurredOn: string;
		frequency: Frequency;
		endDate: string | null;
	}>,
>(schema: T) {
	return schema.superRefine((values, ctx) => {
		
		// if the user hasn't entered an end date, there's nothing to validate.
		if (!values.endDate) return;


		// if the frequency is 'never', an end date is not allowed. If the end date
		if (values.frequency === "never") {
			ctx.addIssue({
				code: "custom",
				message: "Only repeating entries can have an end date",
				path: ["endDate"],
			});

			// if the end date is before the start date, that's not allowed either.
		} else if (values.endDate < values.occurredOn) {
			ctx.addIssue({
				code: "custom",
				message: "End date can't be before the start date",
				path: ["endDate"],
			});
		}
	});
}
