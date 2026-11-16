import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import { EXPENSE_CATEGORIES } from "#/database/expenses/schemas.expenses";

/** The preset categories, plus the expense's own one if it isn't a preset. */
export function categoryOptions(current?: string) {
    const categories: string[] = [...EXPENSE_CATEGORIES];
    if (current && !categories.includes(current)) categories.push(current);
    return categories.map((category) => ({ value: category, label: category }));
}

/** The values that re-save `expense` exactly as it was (used by Undo). */
export function expenseRestoreValues(expense: ExpenseRow) {
	return {
		expenseId: expense.id,
		amount: expense.amount,
		occurredOn: expense.occurred_on,
		category: expense.category,
		description: expense.description,
		frequency: expense.frequency,
		endDate: expense.end_date,
	};
}
