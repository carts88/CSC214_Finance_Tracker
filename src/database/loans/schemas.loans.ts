import { z } from "zod";

/** Largest rate the NUMERIC(6,4) column can hold: 99.99%. */
const MAX_INTEREST_RATE = 0.9999;

/**
 * The editable fields of a loan. Shared by the loan form (client-side
 * validation) and `addLoanFn` (server-side validation) so the two can't
 * drift apart.
 *
 * There's no balance field: the app works it out from the amount borrowed,
 * the start date, the rate and the payments made (see `loanBalance`). For a
 * loan you've been paying for a while, backdate autopay to your first
 * payment so those payments are counted.
 */
export const loanValuesSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "Enter a name")
			.max(100, "Keep the name under 100 characters"),
		/** Amount originally borrowed, in whole cents. */
		principalAmount: z
			.number()
			.int()
			.positive("Enter the amount you borrowed")
			.max(Number.MAX_SAFE_INTEGER),
		/** When the loan was taken out, as 'YYYY-MM-DD'. */
		startedOn: z.iso.date("Pick the date you took out the loan"),
		/**
		 * Yearly rate as a fraction: 0.0525 = 5.25%. The form's PercentField
		 * lets the user type the percent and stores the fraction.
		 */
		annualInterestRate: z
			.number()
			.nonnegative("The rate can't be negative")
			.max(MAX_INTEREST_RATE, "Enter a rate under 100%"),
		/** Planned monthly payment, in whole cents. */
		paymentAmount: z
			.number()
			.int()
			.positive("Enter a monthly payment greater than $0")
			.max(Number.MAX_SAFE_INTEGER),
		/**
		 * Pay the monthly payment automatically: a monthly repeating expense
		 * linked to the loan, which counts as a payment each time it happens.
		 */
		autopay: z.boolean(),
		/**
		 * When autopay is on, the date of the next (or first) autopay payment,
		 * as 'YYYY-MM-DD'. Can be in the past to fill in payments already made.
		 * '' (an empty DateField) when autopay is off.
		 */
		autopayStartsOn: z
			.union([z.literal(""), z.iso.date("Pick the next payment date")])
			.transform((value) => value || null),
	})
	.superRefine((values, ctx) => {
		if (values.autopay && !values.autopayStartsOn) {
			ctx.addIssue({
				code: "custom",
				message: "Pick the date of the next payment",
				path: ["autopayStartsOn"],
			});
		}
		// 'YYYY-MM-DD' strings compare correctly as text.
		if (
			values.autopay &&
			values.autopayStartsOn &&
			values.autopayStartsOn < values.startedOn
		) {
			ctx.addIssue({
				code: "custom",
				message: "Autopay can't start before the loan did",
				path: ["autopayStartsOn"],
			});
		}
	});

export type LoanValues = z.input<typeof loanValuesSchema>;

/**
 * Recording a one-off payment on a loan that started on `startedOn`. It's
 * saved as an expense linked to the loan (`note` is its description).
 */
export function loanPaymentValuesSchema(startedOn: string) {
	return z.object({
		/** Payment in whole cents. */
		amount: z
			.number()
			.int()
			.positive("Enter a payment greater than $0")
			.max(Number.MAX_SAFE_INTEGER),
		/** Date of the payment, as 'YYYY-MM-DD'. */
		paidOn: z.iso
			.date("Pick the payment date")
			.refine(
				(paidOn) => paidOn >= startedOn,
				"Pick a date after the loan started",
			),
		note: z
			.string()
			.trim()
			.max(500, "Keep the note under 500 characters")
			.nullish()
			.transform((value) => value || null),
	});
}

export type LoanPaymentValues = z.input<
	ReturnType<typeof loanPaymentValuesSchema>
>;
