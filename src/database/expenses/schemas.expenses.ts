import { z } from "zod";
import {
	recurrenceFields,
	refineRecurrence,
} from "#/database/schemas.recurrence";

/**
 * The editable fields of an expense. Shared by the expense form (client-side
 * validation) and `addExpenseFn` (server-side validation) so the two can't
 * drift apart.
 *
 * A repeating expense (frequency other than 'never') is one row standing for
 * the whole series: it recurs from `occurredOn` until `endDate`, or forever.
 */
export const expenseValuesSchema = refineRecurrence(
	z.object({
	/** Whole cents, e.g. $12.50 -> 1250. */
	amount: z
		.number()
		.int()
		.positive("Enter an amount greater than $0")
		.max(Number.MAX_SAFE_INTEGER),
	/** Calendar date as 'YYYY-MM-DD'. */
	occurredOn: z.iso.date("Pick a date"),
	category: z
		.string()
		.trim()
		.min(1, "Pick a category")
		.max(100, "Keep the category under 100 characters"),
	description: z
		.string()
		.trim()
		.max(500, "Keep the description under 500 characters")
		.nullish()
		.transform((value) => value || null),
		...recurrenceFields,
	}),
);

export type ExpenseValues = z.input<typeof expenseValuesSchema>;

/** Suggested categories for the expense form's dropdown. */
export const EXPENSE_CATEGORIES = [
	"Housing",
	"Utilities",
	"Groceries",
	"Dining",
	"Transportation",
	"Health",
	"Insurance",
	"Entertainment",
	"Shopping",
	"Subscriptions",
	"Education",
	"Travel",
	"Other",
] as const;
