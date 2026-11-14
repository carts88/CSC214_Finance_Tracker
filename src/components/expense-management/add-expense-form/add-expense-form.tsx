import { format } from "date-fns";
import { useAppForm } from "#/components/form/use-app-form";
import { FieldGroup } from "#/components/ui/field";
import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import {
	EXPENSE_CATEGORIES,
	type ExpenseValues,
	expenseValuesSchema,
} from "#/database/expenses/schemas.expenses";
import { useSaveExpense } from "#/hooks/expenses/use-expenses";

/** The preset categories, plus the expense's own one if it isn't a preset. */
function categoryOptions(current?: string) {
	const categories: string[] = [...EXPENSE_CATEGORIES];
	if (current && !categories.includes(current)) categories.push(current);
	return categories.map((category) => ({ value: category, label: category }));
}

interface AddExpenseFormProps {
	accountId: string;
	expense?: ExpenseRow;
	onSaved?: (expense: ExpenseRow) => void;
}

/** Creates a new expense, or edits `expense` when one is passed. */
export function AddExpenseForm({
	accountId,
	expense,
	onSaved,
}: AddExpenseFormProps) {
	const isEditing = Boolean(expense); // indicates whether the form is for editing an existing expense or creating a new one
	const saveExpense = useSaveExpense(accountId); // handles the logic for saving the expense, either creating a new one or updating an existing one

	const defaultValues: ExpenseValues = {
		amount: expense?.amount ?? 0,
		occurredOn: expense?.occurred_on ?? format(new Date(), "yyyy-MM-dd"),
		category: expense?.category ?? "",
		description: expense?.description ?? "",
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: expenseValuesSchema },
		onSubmit: async ({ value, formApi }) => {
			// Errors thrown here show in <form.FormError />.
			const saved = await saveExpense.mutateAsync({
				...value,
				expenseId: expense?.id,
			});
			if (!isEditing) formApi.reset();
			onSaved?.(saved);
		},
	});

	return (
		<form.AppForm>
			<form.Form>
				<FieldGroup>
					<form.AppField name="amount">
						{(field) => <field.CurrencyField label="Amount" />}
					</form.AppField>

					<form.AppField name="occurredOn">
						{(field) => <field.DateField label="Date" />}
					</form.AppField>

					<form.AppField name="category">
						{(field) => (
							<field.SelectField
								label="Category"
								placeholder="Pick a category"
								options={categoryOptions(expense?.category)}
							/>
						)}
					</form.AppField>

					<form.AppField name="description">
						{(field) => (
							<field.TextareaField
								label="Description"
								description="Optional"
								placeholder="What was this for?"
							/>
						)}
					</form.AppField>

					<form.FormError />

					<div className="flex justify-end gap-2">
						<form.ResetButton />
						<form.SubmitButton>
							{isEditing ? "Save changes" : "Add expense"}
						</form.SubmitButton>
					</div>
				</FieldGroup>
			</form.Form>
		</form.AppForm>
	);
}
