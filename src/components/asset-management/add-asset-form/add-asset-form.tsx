import { format } from "date-fns";
import { useAppForm } from "#/components/form/use-app-form";
import { FieldGroup } from "#/components/ui/field";
import type { AssetRow } from "#/database/assets/queries.assets";
import {
	type AssetValues,
	assetValuesSchema,
} from "#/database/assets/schemas.assets";
import { useSaveAsset } from "#/hooks/assets/use-assets";
import { categoryOptions } from "../utils/asset.utils";

interface AddAssetFormProps {
	accountId: string;
	asset?: AssetRow;
	onSaved?: (asset: AssetRow) => void;
}

/** Creates a new asset, or edits `asset` when one is passed. */
export function AddAssetForm({ accountId, asset, onSaved }: AddAssetFormProps) {
	const isEditing = Boolean(asset);
	const saveAsset = useSaveAsset(accountId);

	const defaultValues: AssetValues = {
		name: asset?.name ?? "",
		category: asset?.category ?? "",
		description: asset?.description ?? "",
		value: asset?.value ?? 0,
		acquiredOn: asset?.acquired_on ?? format(new Date(), "yyyy-MM-dd"),
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: assetValuesSchema },
		onSubmit: async ({ value, formApi }) => {
			// Errors thrown here show in <form.FormError />.
			const saved = await saveAsset.mutateAsync({
				...value,
				assetId: asset?.id,
			});
			if (!isEditing) formApi.reset();
			onSaved?.(saved);
		},
	});

	return (
		<form.AppForm>
			<form.Form>
				<FieldGroup>
					<form.AppField name="name">
						{(field) => (
							<field.TextField
								label="Name"
								placeholder="e.g. 2019 Honda Civic"
							/>
						)}
					</form.AppField>

					<form.AppField name="value">
						{(field) => (
							<field.CurrencyField
								label="Current value"
								description="What it would sell for today."
							/>
						)}
					</form.AppField>

					<form.AppField name="category">
						{(field) => (
							<field.SelectField
								label="Category"
								placeholder="Pick a category"
								options={categoryOptions(asset?.category)}
							/>
						)}
					</form.AppField>

					<form.AppField name="acquiredOn">
						{(field) => <field.DateField label="Acquired on" />}
					</form.AppField>

					<form.AppField name="description">
						{(field) => (
							<field.TextareaField
								label="Description"
								description="Optional."
								rows={3}
							/>
						)}
					</form.AppField>

					<form.FormError />

					<div className="flex justify-end gap-2">
						<form.ResetButton />
						<form.SubmitButton>
							{isEditing ? "Save changes" : "Add asset"}
						</form.SubmitButton>
					</div>
				</FieldGroup>
			</form.Form>
		</form.AppForm>
	);
}
