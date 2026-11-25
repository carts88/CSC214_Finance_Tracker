import { useAppForm } from "#/components/form/use-app-form";
import { FieldGroup } from "#/components/ui/field";
import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import type { LoanRow } from "#/database/loans/queries.loans";
import {
	type LoanPaymentValues,
	loanPaymentValuesSchema,
} from "#/database/loans/schemas.loans";
import { useSaveExpense } from "#/hooks/expenses/use-expenses";
import { formatDate } from "#/lib/utils/formatters/dates";
import { today } from "#/lib/utils/helpers/recurrence";

interface ILoanPaymentForm {
	accountId: string;
	/** The account's base currency; the amount is entered in it. */
	currency: string;
	/** The loan being paid. */
	loan: LoanRow;
	/** Called with the payment's expense once it's saved. */
	onRecorded?: (payment: ExpenseRow) => void;
}

/**
 * Records a one-off payment on `loan`, saved as an expense linked to it (the
 * server makes the loan's name its category). Clears for the next one.
 */
export function LoanPaymentForm({
	accountId,
	currency,
	loan,
	onRecorded,
}: ILoanPaymentForm) {
	const saveExpense = useSaveExpense(accountId);
	const now = today();

	const defaultValues: LoanPaymentValues = {
		// Default to the planned payment, capped at what's left to pay.
		amount: Math.min(loan.payment_amount, loan.outstanding_balance),
		// A loan that starts in the future can't take a payment dated today.
		paidOn: now < loan.started_on ? loan.started_on : now,
		note: "",
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: loanPaymentValuesSchema(loan.started_on) },
		onSubmit: async ({ value, formApi }) => {
			// Errors thrown here show in <form.FormError />.
			const payment = await saveExpense.mutateAsync({
				amount: value.amount,
				occurredOn: value.paidOn,
				category: loan.name,
				description: value.note,
				frequency: "never",
				loanId: loan.id,
			});
			formApi.reset();
			onRecorded?.(payment);
		},
	});

	return (
		<form.AppForm>
			<form.Form>
				<FieldGroup>
					<form.AppField name="amount">
						{(field) => (
							<field.CurrencyField currency={currency} label="Amount paid" />
						)}
					</form.AppField>

					<form.AppField name="paidOn">
						{(field) => (
							<field.DateField
								label="Paid on"
								description={`On or after ${formatDate(loan.started_on)}, when the loan started.`}
							/>
						)}
					</form.AppField>

					<form.AppField name="note">
						{(field) => (
							<field.TextField
								label="Note"
								description="Optional."
								placeholder="e.g. Extra payment"
							/>
						)}
					</form.AppField>

					<form.FormError />

					<div className="flex justify-end">
						<form.SubmitButton>Record payment</form.SubmitButton>
					</div>
				</FieldGroup>
			</form.Form>
		</form.AppForm>
	);
}
