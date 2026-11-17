import { useState } from "react";
import { toast } from "sonner";
import { AssetTable } from "#/components/asset-management/asset-table/asset-table";
import { AssetTableSkeleton } from "#/components/asset-management/asset-table/asset-table-skeleton";
import { assetRestoreValues } from "#/components/asset-management/utils/asset.utils";
import { ErrorAlert } from "#/components/common/error-alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { canWrite } from "#/database/accounts/roles";
import type { AssetRow, SoldAsset } from "#/database/assets/queries.assets";
import {
	useAssets,
	useRemoveAsset,
	useSaveAsset,
} from "#/hooks/assets/use-assets";
import { useRemoveIncome } from "#/hooks/incomes/use-incomes";
import { formatCents } from "#/lib/utils/formatters/currency";
import { AssetFormSheet } from "./asset-form-sheet";
import { AssetsEmptyState } from "./assets-empty-state";
import { SellAssetSheet } from "./sell-asset-sheet";

interface IAssetsCard {
	account: UserAccountRow;
	/** Ids of the checked rows; the page deletes them from the top toolbar. */
	selected: ReadonlySet<string>;
	onSelectedChange: (selected: Set<string>) => void;
}

export function AssetsCard({
	account,
	selected,
	onSelectedChange,
}: IAssetsCard) {
	const assets = useAssets(account.id);
	const removeAsset = useRemoveAsset(account.id);
	const saveAsset = useSaveAsset(account.id);
	const removeIncome = useRemoveIncome(account.id);
	// The asset being edited / sold in a sheet; adding happens from the toolbar.
	const [editing, setEditing] = useState<AssetRow>();
	const [selling, setSelling] = useState<AssetRow>();
	const editable = canWrite(account.role);

	function handleDelete(asset: AssetRow) {
		removeAsset.mutate(asset.id, {
			onSuccess: () =>
				toast.success("Asset deleted", {
					action: {
						label: "Undo",
						// Re-saving with the same id puts the row back.
						onClick: () =>
							saveAsset.mutate(assetRestoreValues(asset), {
								onError: () => toast.error("Couldn't restore the asset"),
							}),
					},
				}),
			onError: (error) =>
				toast.error("Couldn't delete the asset", {
					description: error.message,
				}),
		});
	}

	function handleSold({ asset, income }: SoldAsset) {
		setSelling(undefined);
		toast.success(`Sold ${asset.name}`, {
			description: `${formatCents(income.amount, account.base_currency)} added to income`,
			action: {
				label: "Undo",
				// Put the asset back and drop the sale income.
				onClick: () =>
					void Promise.all([
						saveAsset.mutateAsync(assetRestoreValues(asset)),
						removeIncome.mutateAsync(income.id),
					]).catch(() => toast.error("Couldn't undo the sale")),
			},
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{account.name} assets</CardTitle>
				<CardDescription>
					{editable
						? "Edit, sell, and delete the assets on this account."
						: "You have view-only access to this account."}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{assets.isPending ? (
					<AssetTableSkeleton />
				) : assets.isError ? (
					<ErrorAlert title="Couldn't load assets" error={assets.error} />
				) : assets.data.length === 0 ? (
					<AssetsEmptyState />
				) : (
					<AssetTable
						assets={assets.data}
						currency={account.base_currency}
						canEdit={editable}
						onEdit={setEditing}
						onDelete={handleDelete}
						onSell={setSelling}
						selected={selected}
						onSelectedChange={onSelectedChange}
					/>
				)}
			</CardContent>

			<AssetFormSheet
				account={account}
				open={editing !== undefined}
				asset={editing}
				onClose={() => setEditing(undefined)}
			/>
			<SellAssetSheet
				account={account}
				asset={selling}
				onClose={() => setSelling(undefined)}
				onSold={handleSold}
			/>
		</Card>
	);
}
