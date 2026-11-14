import { z } from "zod";

/**
 * The editable fields of an expense. Shared by the expense form (client-side
 * validation) and `addExpenseFn` (server-side validation) so the two can't
 * drift apart.
 */
export const expenseValuesSchema = z.object({
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
});

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
	"Education",
	"Travel",
	"Other",
] as const;
