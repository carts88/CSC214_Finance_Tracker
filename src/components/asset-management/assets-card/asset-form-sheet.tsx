import { toast } from "sonner";
import { AddAssetForm } from "#/components/asset-management/add-asset-form/add-asset-form";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import type { AssetRow } from "#/database/assets/queries.assets";

interface IAssetFormSheet {
	account: UserAccountRow;
	open: boolean;
	/** The asset being edited; omit to add a new one. */
	asset?: AssetRow;
	onClose: () => void;
}

export function AssetFormSheet({
	account,
	open,
	asset,
	onClose,
}: IAssetFormSheet) {
	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>{asset ? "Edit asset" : "Add asset"}</SheetTitle>
					<SheetDescription>
						{asset
							? "Update the details of this asset."
							: `Record something ${account.name} owns.`}
					</SheetDescription>
				</SheetHeader>
				<div className="px-4 pb-4">
					<AddAssetForm
						// New key per asset so the form's defaults reload.
						key={asset?.id ?? "new"}
						accountId={account.id}
						currency={account.base_currency}
						asset={asset}
						onSaved={() => {
							toast.success(asset ? "Asset updated" : "Asset added");
							onClose();
						}}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
