import { useStore } from "@tanstack/react-form";
import { useAppForm } from "#/components/form/use-app-form";
import { FieldGroup } from "#/components/ui/field";
import type { LoanRow } from "#/database/loans/queries.loans";
import {
	type LoanValues,
	loanValuesSchema,
} from "#/database/loans/schemas.loans";
import { useSaveLoan } from "#/hooks/loans/use-loans";
import { today } from "#/lib/utils/helpers/recurrence";
import { isoMonthFromToday } from "./utils/loan.utils";

interface ILoanForm {
	accountId: string;
	/** The account's base currency; amounts are entered in it. */
	currency: string;
	/** The loan being edited; omit to add a new one. */
	loan?: LoanRow;
	onSaved?: (loan: LoanRow) => void;
}

/**
 * Creates a new loan, or edits `loan` when one is passed. The balance isn't
 * entered: it's worked out from the amount, start date, rate and payments.
 * For a loan you've been paying a while, backdate autopay to your first
 * payment so those payments count.
 */
export function LoanForm({ accountId, currency, loan, onSaved }: ILoanForm) {
	const isEditing = Boolean(loan);
	const saveLoan = useSaveLoan(accountId);
	/** True when editing a loan whose autopay is running. */
	const hadAutopay = loan?.autopay_next_on != null;

	const defaultValues: LoanValues = {
		name: loan?.name ?? "",
		principalAmount: loan?.principal_amount ?? 0,
		startedOn: loan?.started_on ?? today(),
		annualInterestRate: loan?.annual_interest_rate ?? 0,
		paymentAmount: loan?.payment_amount ?? 0,
		// New loans pay automatically by default; an edited loan shows its
		// current autopay, or a month from today if it has none.
		autopay: loan ? hadAutopay : true,
		autopayStartsOn: loan?.autopay_next_on ?? isoMonthFromToday(),
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: loanValuesSchema },
		onSubmit: async ({ value, formApi }) => {
			// Errors thrown here show in <form.FormError />.
			const saved = await saveLoan.mutateAsync({
				...value,
				loanId: loan?.id,
			});
			if (!isEditing) formApi.reset();
			onSaved?.(saved);
		},
	});

	const autopay = useStore(form.store, (state) => state.values.autopay);

	return (
		<form.AppForm>
			<form.Form>
				<FieldGroup>
					<form.AppField name="name">
						{(field) => (
							<field.TextField
								label="Name"
								placeholder="e.g. Car loan, Student loan"
							/>
						)}
					</form.AppField>

					<form.AppField name="principalAmount">
						{(field) => (
							<field.CurrencyField
								currency={currency}
								label="Amount borrowed"
								description="The original loan amount."
							/>
						)}
					</form.AppField>

					<form.AppField name="startedOn">
						{(field) => (
							<field.DateField
								label="Taken out on"
								description="The balance is worked out from this date: the amount borrowed, plus monthly interest, minus your payments."
							/>
						)}
					</form.AppField>

					<form.AppField name="annualInterestRate">
						{(field) => (
							<field.PercentField
								label="Interest rate (APR)"
								description="The yearly rate on your statement."
							/>
						)}
					</form.AppField>

					<form.AppField name="paymentAmount">
						{(field) => (
							<field.CurrencyField
								currency={currency}
								label="Monthly payment"
								description={
									autopay && hadAutopay
										? "Changing it starts a new autopay amount from the next payment; past payments keep the old amount."
										: "What you plan to pay each month."
								}
							/>
						)}
					</form.AppField>

					<form.AppField name="autopay">
						{(field) => (
							<field.CheckboxField
								label="Pay automatically each month (autopay)"
								description={autopayHint(autopay, hadAutopay)}
							/>
						)}
					</form.AppField>

					{autopay && (
						<form.AppField name="autopayStartsOn">
							{(field) => (
								<field.DateField
									label="Next payment on"
									description="Repeats monthly from this date. Already paying this loan? Pick your first payment date so past payments count toward the balance."
								/>
							)}
						</form.AppField>
					)}

					<form.FormError />

					<div className="flex justify-end gap-2">
						<form.ResetButton />
						<form.SubmitButton>
							{isEditing ? "Save changes" : "Add loan"}
						</form.SubmitButton>
					</div>
				</FieldGroup>
			</form.Form>
		</form.AppForm>
	);
}

/** What the autopay checkbox will do, given its state and the loan's. */
function autopayHint(autopay: boolean, hadAutopay: boolean): string {
	if (autopay) {
		return "Adds the monthly payment as a repeating expense in this loan's category. Each time it happens it counts as a payment and lowers the balance.";
	}
	if (hadAutopay) {
		return "Autopay will stop after today. Payments already made are kept.";
	}
	return "Record payments yourself from the loan's Payments, or as expenses.";
}
