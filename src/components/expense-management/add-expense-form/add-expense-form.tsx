import { useStore } from "@tanstack/react-form";
import { format } from "date-fns";
import { useAppForm } from "#/components/form/use-app-form";
import { FieldGroup } from "#/components/ui/field";
import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import {
	type ExpenseValues,
	expenseValuesSchema,
} from "#/database/expenses/schemas.expenses";
import { FREQUENCIES } from "#/database/schemas.recurrence";
import { useSaveExpense } from "#/hooks/expenses/use-expenses";
import { useLoans } from "#/hooks/loans/use-loans";
import {
	categoryOptions,
	loanCategoryValue,
	loanIdFromCategory,
} from "../utils/expense.utils";

interface AddExpenseFormProps {
	accountId: string;
	/** The account's base currency; amounts are entered in it. */
	currency: string;
	expense?: ExpenseRow;
	onSaved?: (expense: ExpenseRow) => void;
}

/**
 * Creates a new expense, or edits `expense` when one is passed. Picking a
 * "Repeats" frequency makes it a recurring expense; editing a recurring
 * expense changes the whole series.
 */
export function AddExpenseForm({
	accountId,
	currency,
	expense,
	onSaved,
}: AddExpenseFormProps) {
	const isEditing = Boolean(expense); // indicates whether the form is for editing an existing expense or creating a new one
	const saveExpense = useSaveExpense(accountId); // handles the logic for saving the expense, either creating a new one or updating an existing one

	// Each loan is offered as its own category; picking one makes this
	// expense a payment on that loan.
	const loans = useLoans(accountId);

	const defaultValues: ExpenseValues = {
		amount: expense?.amount ?? 0,
		occurredOn: expense?.occurred_on ?? format(new Date(), "yyyy-MM-dd"),
		// A loan payment's dropdown value is the loan, not its name.
		category: expense?.loan_id
			? loanCategoryValue(expense.loan_id)
			: (expense?.category ?? ""),
		description: expense?.description ?? "",
		frequency: expense?.frequency ?? "never",
		endDate: expense?.end_date ?? "",
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: expenseValuesSchema },
		onSubmit: async ({ value, formApi }) => {
			// Errors thrown here show in <form.FormError />.
			const saved = await saveExpense.mutateAsync({
				...value,
				loanId: loanIdFromCategory(value.category),
				expenseId: expense?.id,
			});
			if (!isEditing) formApi.reset();
			onSaved?.(saved);
		},
	});

	const repeats = useStore(
		form.store,
		(state) => state.values.frequency !== "never",
	);
	const paysLoan = useStore(
		form.store,
		(state) => loanIdFromCategory(state.values.category) !== null,
	);

	return (
		<form.AppForm>
			<form.Form>
				<FieldGroup>
					<form.AppField name="amount">
						{(field) => (
							<field.CurrencyField currency={currency} label="Amount" />
						)}
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

					<form.AppField name="category">
						{(field) => (
							<field.SelectField
								label="Category"
								placeholder="Pick a category"
								description={
									paysLoan
										? `Counts as a payment on this loan${repeats ? " each time it repeats" : ""}, lowering its balance.`
										: undefined
								}
								options={categoryOptions(
									// A loan payment's category is its loan, already listed.
									expense?.loan_id ? undefined : expense?.category,
									loans.data,
								)}
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
