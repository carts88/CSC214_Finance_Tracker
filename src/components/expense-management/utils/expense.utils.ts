import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import { EXPENSE_CATEGORIES } from "#/database/expenses/schemas.expenses";
import type { LoanRow } from "#/database/loans/queries.loans";

/**
 * Category-dropdown values for loans are "loan:<id>", so a loan can't clash
 * with a preset category of the same name. The server saves the loan's name
 * as the category.
 */
const LOAN_CATEGORY_PREFIX = "loan:";

/** The category dropdown value for paying `loanId`. */
export function loanCategoryValue(loanId: string): string {
	return `${LOAN_CATEGORY_PREFIX}${loanId}`;
}

/** The loan a category dropdown value pays, or null for a plain category. */
export function loanIdFromCategory(value: string): string | null {
	return value.startsWith(LOAN_CATEGORY_PREFIX)
		? value.slice(LOAN_CATEGORY_PREFIX.length)
		: null;
}

/**
 * The preset categories, plus the expense's own one if it isn't a preset,
 * then one entry per loan ("Student Loans · loan payment").
 */
export function categoryOptions(current?: string, loans: LoanRow[] = []) {
	const categories: string[] = [...EXPENSE_CATEGORIES];
	if (current && !categories.includes(current)) categories.push(current);
	return [
		...categories.map((category) => ({ value: category, label: category })),
		...loans.map((loan) => ({
			value: loanCategoryValue(loan.id),
			label: `${loan.name} · loan payment`,
		})),
	];
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
		loanId: expense.loan_id,
	};
}
