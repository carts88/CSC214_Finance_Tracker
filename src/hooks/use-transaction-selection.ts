import { useState } from "react";

/**
 * Checked rows in a page's income, expense, and asset tables. The page passes
 * each set to its card and `DeleteSelectedButton` deletes them from the
 * toolbar.
 */
export function useTransactionSelection() {
	const [incomes, setIncomes] = useState<Set<string>>(() => new Set());
	const [expenses, setExpenses] = useState<Set<string>>(() => new Set());
	const [assets, setAssets] = useState<Set<string>>(() => new Set());

	function clear() {
		setIncomes(new Set());
		setExpenses(new Set());
		setAssets(new Set());
	}

	return {
		incomes,
		setIncomes,
		expenses,
		setExpenses,
		assets,
		setAssets,
		clear,
	};
}
