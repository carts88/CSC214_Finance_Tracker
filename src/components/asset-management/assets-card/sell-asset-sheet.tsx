import { SellAssetForm } from "#/components/asset-management/sell-asset-form/sell-asset-form";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import type { AssetRow, SoldAsset } from "#/database/assets/queries.assets";

interface ISellAssetSheet {
	account: UserAccountRow;
	/** The asset being sold; the sheet is closed while this is undefined. */
	asset: AssetRow | undefined;
	onClose: () => void;
	onSold: (sold: SoldAsset) => void;
}

export function SellAssetSheet({
	account,
	asset,
	onClose,
	onSold,
}: ISellAssetSheet) {
	return (
		<Sheet
			open={asset !== undefined}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Sell {asset?.name ?? "asset"}</SheetTitle>
					<SheetDescription>
						The sale is added to {account.name}'s income and the asset is
						removed.
					</SheetDescription>
				</SheetHeader>
				<div className="px-4 pb-4">
					{asset && (
						<SellAssetForm
							// New key per asset so the form's defaults reload.
							key={asset.id}
							accountId={account.id}
							asset={asset}
							onSold={onSold}
						/>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
