import { addMonths, format, parse } from "date-fns";

/**
 * Payoff math for a single loan. Pure functions (no React, no SQL), so they
 * can be used anywhere and tested on their own. All money is whole cents.
 *
 * This is a simple monthly model: interest is charged once a month on the
 * remaining balance, then the payment is applied. Real lenders (especially
 * credit cards, which compound daily) will differ slightly.
 */

/** Stop simulating after this many months (50 years) so bad input can't loop forever. */
const MAX_MONTHS = 600;

export interface PayoffInput {
	/** What is still owed, in cents. */
	balance: number;
	/** Yearly rate as a fraction, e.g. 0.0525. */
	annualInterestRate: number;
	/** Monthly payment, in cents. */
	monthlyPayment: number;
}

export interface PayoffEstimate {
	/** Number of monthly payments left until the balance reaches 0. */
	months: number;
	/** Total interest paid over those months, in cents. */
	totalInterest: number;
	/** Month of the final payment. */
	payoffDate: Date;
}

/** Interest charged for one month on `balance`, rounded to whole cents. */
export function monthlyInterest(
	balance: number,
	annualInterestRate: number,
): number {
	return Math.round((balance * annualInterestRate) / 12);
}

/** A payment as `loanBalance` needs it. Extra fields are passed through. */
export interface LoanPaymentInput {
	/** 'YYYY-MM-DD'. */
	paidOn: string;
	/** Whole cents. */
	amount: number;
}

export interface LoanBalanceInput<P extends LoanPaymentInput> {
	/** Amount borrowed, in cents: the balance on `startedOn`. */
	principal: number;
	/** Yearly rate as a fraction, e.g. 0.0525. */
	annualInterestRate: number;
	/** When the loan was taken out, 'YYYY-MM-DD'. */
	startedOn: string;
	/** Payments made, in any order. */
	payments: P[];
	/** Work out the balance as of this date, 'YYYY-MM-DD' (usually today). */
	asOf: string;
}

/**
 * One change to a loan's balance, in date order. `balance` is what's owed
 * right after it, in cents.
 */
export type LoanEvent<P extends LoanPaymentInput = LoanPaymentInput> =
	| { kind: "interest"; on: string; amount: number; balance: number }
	| {
			kind: "payment";
			on: string;
			amount: number;
			balance: number;
			payment: P;
	  };

export interface LoanBalance<P extends LoanPaymentInput = LoanPaymentInput> {
	/** What is still owed on `asOf`, in cents. Never below 0. */
	balance: number;
	/** Sum of the payments, in cents. */
	totalPaid: number;
	/** Interest added since the loan started, in cents. */
	interestCharged: number;
	/** Every interest charge and payment, oldest first. */
	events: LoanEvent<P>[];
}

/**
 * Works out a loan's balance from scratch, with the same monthly model as
 * `estimatePayoff`: it starts at `principal` on `startedOn`; on each monthly
 * anniversary of that date a month's interest is added to whatever is owed;
 * each payment is subtracted on its date. A payment on an anniversary is
 * applied after that month's interest. Once the balance reaches 0 no more
 * interest is charged, and overpayments don't make it negative.
 */
export function loanBalance<P extends LoanPaymentInput>({
	principal,
	annualInterestRate,
	startedOn,
	payments,
	asOf,
}: LoanBalanceInput<P>): LoanBalance<P> {
	const start = parse(startedOn, "yyyy-MM-dd", new Date());
	// 'YYYY-MM-DD' strings sort correctly as text.
	const sorted = [...payments].sort((a, b) =>
		a.paidOn < b.paidOn ? -1 : a.paidOn > b.paidOn ? 1 : 0,
	);

	let balance = principal;
	let totalPaid = 0;
	let interestCharged = 0;
	const events: LoanEvent<P>[] = [];
	let next = 0;
	function payUntil(beforeOrOn: (paidOn: string) => boolean) {
		while (next < sorted.length && beforeOrOn(sorted[next].paidOn)) {
			const payment = sorted[next];
			totalPaid += payment.amount;
			balance = Math.max(balance - payment.amount, 0);
			events.push({
				kind: "payment",
				on: payment.paidOn,
				amount: payment.amount,
				balance,
				payment,
			});
			next += 1;
		}
	}

	// Counting each anniversary from `start` (not from the previous one) keeps
	// month-end dates from drifting: Jan 31 -> Feb 28 -> Mar 31.
	for (let month = 1; month <= MAX_MONTHS * 2; month += 1) {
		const anniversary = format(addMonths(start, month), "yyyy-MM-dd");
		if (anniversary > asOf) break;
		payUntil((paidOn) => paidOn < anniversary);
		const interest = monthlyInterest(balance, annualInterestRate);
		if (interest === 0) continue;
		balance += interest;
		interestCharged += interest;
		events.push({
			kind: "interest",
			on: anniversary,
			amount: interest,
			balance,
		});
	}
	payUntil((paidOn) => paidOn <= asOf);

	return { balance, totalPaid, interestCharged, events };
}

/** One month of a payoff plan: the balance after that month's payment. */
export interface PayoffMonth {
	on: Date;
	/** Interest added that month, in cents. */
	interest: number;
	/** What's owed after the payment, in cents. */
	balance: number;
}

/**
 * The month-by-month plan behind `estimatePayoff`: add that month's
 * interest, subtract the payment, repeat until the balance is 0. The first
 * payment is one month after `from`.
 *
 * @returns the months, or null if the payment never pays the loan off (it
 *   doesn't cover the interest, or it takes over 50 years)
 */
export function payoffSchedule(
	{ balance, annualInterestRate, monthlyPayment }: PayoffInput,
	from: Date = new Date(),
): PayoffMonth[] | null {
	if (
		balance > 0 &&
		monthlyPayment <= monthlyInterest(balance, annualInterestRate)
	) {
		return null;
	}

	const months: PayoffMonth[] = [];
	let remaining = balance;
	while (remaining > 0) {
		if (months.length >= MAX_MONTHS) return null;
		const interest = monthlyInterest(remaining, annualInterestRate);
		remaining = Math.max(remaining + interest - monthlyPayment, 0);
		months.push({
			on: addMonths(from, months.length + 1),
			interest,
			balance: remaining,
		});
	}
	return months;
}

/**
 * Estimates when the loan is paid off and the interest still to pay (see
 * `payoffSchedule`). The last payment is usually smaller than
 * `monthlyPayment`.
 *
 * @param from date to count months from (defaults to today)
 * @returns the estimate, or null if the payment doesn't cover the monthly
 *   interest (the balance would never go down) or payoff takes over 50 years
 */
export function estimatePayoff(
	input: PayoffInput,
	from: Date = new Date(),
): PayoffEstimate | null {
	const schedule = payoffSchedule(input, from);
	if (!schedule) return null;
	return {
		months: schedule.length,
		totalInterest: schedule.reduce((sum, month) => sum + month.interest, 0),
		payoffDate: schedule.at(-1)?.on ?? from,
	};
}
