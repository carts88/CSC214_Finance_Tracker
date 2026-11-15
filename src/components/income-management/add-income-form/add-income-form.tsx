import { useStore } from "@tanstack/react-form";
import { format } from "date-fns";
import { useAppForm } from "#/components/form/use-app-form";
import { FieldGroup } from "#/components/ui/field";
import type { IncomeRow } from "#/database/incomes/queries.incomes";
import {
	type IncomeValues,
	incomeValuesSchema,
} from "#/database/incomes/schemas.incomes";
import { FREQUENCIES } from "#/database/schemas.recurrence";
import { useSaveIncome } from "#/hooks/incomes/use-incomes";
import { sourceOptions } from "../utils/income.utils";

interface AddIncomeFormProps {
	accountId: string;
	income?: IncomeRow;
	onSaved?: (income: IncomeRow) => void;
}

/**
 * Creates a new income, or edits `income` when one is passed. Picking a
 * "Repeats" frequency makes it a recurring income; editing a recurring
 * income changes the whole series.
 */
export function AddIncomeForm({
	accountId,
	income,
	onSaved,
}: AddIncomeFormProps) {
	const isEditing = Boolean(income);
	const saveIncome = useSaveIncome(accountId);

	const defaultValues: IncomeValues = {
		amount: income?.amount ?? 0,
		occurredOn: income?.occurred_on ?? format(new Date(), "yyyy-MM-dd"),
		source: income?.source ?? "",
		frequency: income?.frequency ?? "never",
		endDate: income?.end_date ?? "",
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: incomeValuesSchema },
		onSubmit: async ({ value, formApi }) => {
			// Errors thrown here show in <form.FormError />.
			const saved = await saveIncome.mutateAsync({
				...value,
				incomeId: income?.id,
			});
			if (!isEditing) formApi.reset();
			onSaved?.(saved);
		},
	});

	const repeats = useStore(
		form.store,
		(state) => state.values.frequency !== "never",
	);

	return (
		<form.AppForm>
			<form.Form>
				<FieldGroup>
					<form.AppField name="amount">
						{(field) => <field.CurrencyField label="Amount" />}
					</form.AppField>

					<form.AppField
						name="frequency"
						listeners={{
							// A one-off can't have an end date; clear the hidden field.
							onChange: ({ value }) => {
								if (value === "never") form.setFieldValue("endDate", "");
							},
						}}
					>
						{(field) => (
							<field.SelectField
								label="Repeats"
								description={
									isEditing && repeats
										? "Changes apply to every occurrence in this series."
										: undefined
								}
								options={FREQUENCIES}
							/>
						)}
					</form.AppField>

					<form.AppField name="occurredOn">
						{(field) => (
							<field.DateField label={repeats ? "Starts on" : "Date"} />
						)}
					</form.AppField>

					{repeats && (
						<form.AppField name="endDate">
							{(field) => (
								<field.DateField
									label="Ends on"
									description="Optional. Leave empty to repeat until you stop it."
									placeholder="No end date"
								/>
							)}
						</form.AppField>
					)}

					<form.AppField name="source">
						{(field) => (
							<field.SelectField
								label="Source"
								placeholder="Pick a source"
								options={sourceOptions(income?.source)}
							/>
						)}
					</form.AppField>

					<form.FormError />

					<div className="flex justify-end gap-2">
						<form.ResetButton />
						<form.SubmitButton>
							{isEditing ? "Save changes" : "Add income"}
						</form.SubmitButton>
					</div>
				</FieldGroup>
			</form.Form>
		</form.AppForm>
	);
}
