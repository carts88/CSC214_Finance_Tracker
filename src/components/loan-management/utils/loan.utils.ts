import { addMonths, format } from "date-fns";
import type { LoanRow } from "#/database/loans/queries.loans";
import {
	estimatePayoff,
	type PayoffEstimate,
} from "#/lib/utils/helpers/loan-payoff";

/** 0.0525 -> "5.25%". */
export function formatRate(fraction: number): string {
	return `${Number((fraction * 100).toFixed(2))}%`;
}

/** One month from today as 'YYYY-MM-DD': the default first autopay date. */
export function isoMonthFromToday(): string {
	return format(addMonths(new Date(), 1), "yyyy-MM-dd");
}

/** True once nothing is owed on the loan. */
export function isPaidOff(loan: LoanRow): boolean {
	return loan.outstanding_balance === 0;
}

/** The payoff estimate for one loan's current balance at its planned monthly payment. */
export function loanPayoff(loan: LoanRow): PayoffEstimate | null {
	return estimatePayoff({
		balance: loan.outstanding_balance,
		annualInterestRate: loan.annual_interest_rate,
		monthlyPayment: loan.payment_amount,
	});
}

/** Share of the amount borrowed that's been paid back, from 0 to 1. */
export function paidOffShare(loan: LoanRow): number {
	if (loan.principal_amount <= 0) return 0;
	return Math.min(
		Math.max(1 - loan.outstanding_balance / loan.principal_amount, 0),
		1,
	);
}

/**
 * What's owed in total, and the monthly payments on loans not yet paid
 * off, in cents. Shared by the table footer and the summary strip.
 */
export function loanTotals(loans: LoanRow[]) {
	const owing = loans.filter((loan) => !isPaidOff(loan));
	return {
		owing,
		totalOwed: owing.reduce((sum, l) => sum + l.outstanding_balance, 0),
		totalMonthly: owing.reduce((sum, l) => sum + l.payment_amount, 0),
	};
}

export interface LoanSummary {
	/** Sum of outstanding balances, in cents. */
	totalOwed: number;
	/** Sum of planned monthly payments on loans not yet paid off, in cents. */
	totalMonthly: number;
	/** Interest rate averaged by balance, as a fraction; 0 when nothing is owed. */
	averageRate: number;
	/** When the last loan is paid off; null if nothing is owed. */
	debtFreeDate: Date | null;
	/** Loans whose payment doesn't cover their interest. */
	stuckCount: number;
	/** Total interest still to pay across loans that will be paid off, in cents. */
	interestLeft: number;
}

/** Headline numbers for the summary strip. */
export function summarizeLoans(loans: LoanRow[]): LoanSummary {
	const { owing, totalOwed, totalMonthly } = loanTotals(loans);
	const averageRate = totalOwed
		? owing.reduce(
				(sum, l) => sum + l.annual_interest_rate * l.outstanding_balance,
				0,
			) / totalOwed
		: 0;

	let debtFreeDate: Date | null = null;
	let stuckCount = 0;
	let interestLeft = 0;
	for (const loan of owing) {
		const payoff = loanPayoff(loan);
		if (!payoff) {
			stuckCount += 1;
			continue;
		}
		interestLeft += payoff.totalInterest;
		if (!debtFreeDate || payoff.payoffDate > debtFreeDate) {
			debtFreeDate = payoff.payoffDate;
		}
	}

	return {
		totalOwed,
		totalMonthly,
		averageRate,
		debtFreeDate,
		stuckCount,
		interestLeft,
	};
}
