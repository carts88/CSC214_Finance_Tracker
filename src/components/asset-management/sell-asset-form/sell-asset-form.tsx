import { format } from "date-fns";
import { useAppForm } from "#/components/form/use-app-form";
import { FieldGroup } from "#/components/ui/field";
import type { AssetRow, SoldAsset } from "#/database/assets/queries.assets";
import {
	type SellAssetValues,
	sellAssetValuesSchema,
} from "#/database/assets/schemas.assets";
import { useSellAsset } from "#/hooks/assets/use-assets";

interface SellAssetFormProps {
	accountId: string;
	asset: AssetRow;
	onSold?: (sold: SoldAsset) => void;
}

/**
 * Sells `asset`: the sale price is recorded as a one-off income
 * ("Sale of <name>") and the asset is removed.
 */
export function SellAssetForm({
	accountId,
	asset,
	onSold,
}: SellAssetFormProps) {
	const sellAsset = useSellAsset(accountId);

	const defaultValues: SellAssetValues = {
		price: asset.value,
		soldOn: format(new Date(), "yyyy-MM-dd"),
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: sellAssetValuesSchema },
		onSubmit: async ({ value }) => {
			// Errors thrown here show in <form.FormError />.
			const sold = await sellAsset.mutateAsync({
				...value,
				assetId: asset.id,
			});
			onSold?.(sold);
		},
	});

	return (
		<form.AppForm>
			<form.Form>
				<FieldGroup>
					<form.AppField name="price">
						{(field) => (
							<field.CurrencyField
								label="Sale price"
								description="Recorded as income on this account."
							/>
						)}
					</form.AppField>

					<form.AppField name="soldOn">
						{(field) => <field.DateField label="Sold on" />}
					</form.AppField>

					<form.FormError />

					<div className="flex justify-end gap-2">
						<form.ResetButton />
						<form.SubmitButton>Sell asset</form.SubmitButton>
					</div>
				</FieldGroup>
			</form.Form>
		</form.AppForm>
	);
}
