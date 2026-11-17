import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { assetRestoreValues } from "#/components/asset-management/utils/asset.utils";
import { expenseRestoreValues } from "#/components/expense-management/utils/expense.utils";
import { incomeRestoreValues } from "#/components/income-management/utils/income.utils";
import { Button } from "#/components/ui/button";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import {
	useAssets,
	useRemoveAssets,
	useSaveAsset,
} from "#/hooks/assets/use-assets";
import {
	useExpenses,
	useRemoveExpenses,
	useSaveExpense,
} from "#/hooks/expenses/use-expenses";
import {
	useIncomes,
	useRemoveIncomes,
	useSaveIncome,
} from "#/hooks/incomes/use-incomes";

interface IDeleteSelectedButton {
	account: UserAccountRow;
	/** Checked income ids (may include ids of rows that no longer exist). */
	selectedIncomes: ReadonlySet<string>;
	/** Checked expense ids (may include ids of rows that no longer exist). */
	selectedExpenses: ReadonlySet<string>;
	/**
	 * Checked asset ids. Omit on pages without an asset table, so the asset
	 * list isn't fetched there.
	 */
	selectedAssets?: ReadonlySet<string>;
	/** Called once the rows are deleted, so the page can clear its selection. */
	onDeleted: () => void;
}

const plural = (n: number) => `${n} ${n === 1 ? "row" : "rows"}`;

/**
 * "Delete N rows" for the top toolbar. Deletes every checked income, expense,
 * and asset on the account, with an Undo toast. Renders nothing when no rows
 * are checked.
 */
export function DeleteSelectedButton({
	account,
	selectedIncomes,
	selectedExpenses,
	selectedAssets,
	onDeleted,
}: IDeleteSelectedButton) {
	// Same query keys as the cards, so these read the cached lists.
	const incomes = useIncomes(account.id);
	const expenses = useExpenses(account.id);
	const assets = useAssets(selectedAssets ? account.id : undefined);
	const removeIncomes = useRemoveIncomes(account.id);
	const removeExpenses = useRemoveExpenses(account.id);
	const removeAssets = useRemoveAssets(account.id);
	const saveIncome = useSaveIncome(account.id);
	const saveExpense = useSaveExpense(account.id);
	const saveAsset = useSaveAsset(account.id);

	// Only count ids that are still on screen (a row may have been deleted
	// from its own trash button while checked).
	const incomeRows = (incomes.data ?? []).filter((r) =>
		selectedIncomes.has(r.id),
	);
	const expenseRows = (expenses.data ?? []).filter((r) =>
		selectedExpenses.has(r.id),
	);
	const assetRows = (assets.data ?? []).filter((r) =>
		selectedAssets?.has(r.id),
	);
	const count = incomeRows.length + expenseRows.length + assetRows.length;
	const pending =
		removeIncomes.isPending ||
		removeExpenses.isPending ||
		removeAssets.isPending;

	if (count === 0) return null;

	async function handleDelete() {
		try {
			await Promise.all([
				incomeRows.length > 0 &&
					removeIncomes.mutateAsync(incomeRows.map((r) => r.id)),
				expenseRows.length > 0 &&
					removeExpenses.mutateAsync(expenseRows.map((r) => r.id)),
				assetRows.length > 0 &&
					removeAssets.mutateAsync(assetRows.map((r) => r.id)),
			]);
		} catch (error) {
			toast.error(`Couldn't delete ${plural(count)}`, {
				description: error instanceof Error ? error.message : undefined,
			});
			return;
		}

		onDeleted();
		toast.success(`Deleted ${plural(count)}`, {
			action: {
				label: "Undo",
				// Re-saving each row with its old id puts it back.
				onClick: () =>
					void Promise.all([
						...incomeRows.map((r) =>
							saveIncome.mutateAsync(incomeRestoreValues(r)),
						),
						...expenseRows.map((r) =>
							saveExpense.mutateAsync(expenseRestoreValues(r)),
						),
						...assetRows.map((r) =>
							saveAsset.mutateAsync(assetRestoreValues(r)),
						),
					]).catch(() => toast.error("Couldn't restore every row")),
			},
		});
	}

	return (
		<Button
			variant="destructive"
			size="sm"
			disabled={pending}
			onClick={handleDelete}
		>
			<Trash2 />
			Delete {plural(count)}
		</Button>
	);
}
