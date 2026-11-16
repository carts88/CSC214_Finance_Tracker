import { useState } from "react";

/**
 * Checked rows in a page's income and expense tables. The page passes each
 * set to its card and `DeleteSelectedButton` deletes them from the toolbar.
 */
export function useTransactionSelection() {
	const [incomes, setIncomes] = useState<Set<string>>(() => new Set());
	const [expenses, setExpenses] = useState<Set<string>>(() => new Set());

	function clear() {
		setIncomes(new Set());
		setExpenses(new Set());
	}

	return { incomes, setIncomes, expenses, setExpenses, clear };
}
