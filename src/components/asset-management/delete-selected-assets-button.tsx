import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { assetRestoreValues } from "#/components/asset-management/utils/asset.utils";
import { Button } from "#/components/ui/button";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import {
	useAssets,
	useRemoveAssets,
	useSaveAsset,
} from "#/hooks/assets/use-assets";

interface IDeleteSelectedAssetsButton {
	account: UserAccountRow;
	/** Checked asset ids (may include ids of rows that no longer exist). */
	selected: ReadonlySet<string>;
	/** Called once the rows are deleted, so the page can clear its selection. */
	onDeleted: () => void;
}

const plural = (n: number) => `${n} ${n === 1 ? "asset" : "assets"}`;

/**
 * "Delete N assets" for the top toolbar, with an Undo toast. Renders nothing
 * when no rows are checked.
 */
export function DeleteSelectedAssetsButton({
	account,
	selected,
	onDeleted,
}: IDeleteSelectedAssetsButton) {
	// Same query key as the card, so this reads the cached list.
	const assets = useAssets(account.id);
	const removeAssets = useRemoveAssets(account.id);
	const saveAsset = useSaveAsset(account.id);

	// Only count ids that are still on screen (a row may have been deleted
	// or sold while checked).
	const rows = (assets.data ?? []).filter((r) => selected.has(r.id));
	const count = rows.length;

	if (count === 0) return null;

	async function handleDelete() {
		try {
			await removeAssets.mutateAsync(rows.map((r) => r.id));
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
					void Promise.all(
						rows.map((r) => saveAsset.mutateAsync(assetRestoreValues(r))),
					).catch(() => toast.error("Couldn't restore every asset")),
			},
		});
	}

	return (
		<Button
			variant="destructive"
			size="sm"
			disabled={removeAssets.isPending}
			onClick={handleDelete}
		>
			<Trash2 />
			Delete {plural(count)}
		</Button>
	);
}
