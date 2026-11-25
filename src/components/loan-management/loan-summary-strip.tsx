import {
	StatStrip,
	type StatStripItem,
} from "#/components/common/stats/stat-strip";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { useLoans } from "#/hooks/loans/use-loans";
import { useMoney } from "#/hooks/use-money";
import { formatMonthYear } from "#/lib/utils/formatters/dates";
import {
	formatRate,
	type LoanSummary,
	summarizeLoans,
} from "./utils/loan.utils";

interface ILoanSummaryStrip {
	account: UserAccountRow;
}

/** Headline debt numbers: total owed, monthly payments, rate, debt-free date. */
export function LoanSummaryStrip({ account }: ILoanSummaryStrip) {
	// Shares the cached query with LoansCard, so this doesn't refetch.
	const loans = useLoans(account.id);
	const { format } = useMoney(account.base_currency);

	// The card shows the error; nothing useful to summarize here.
	if (loans.isError) return null;

	const summary = summarizeLoans(loans.data ?? []);

	return (
		<StatStrip
			loading={loans.isPending}
			items={[
				{
					label: "Total owed",
					value: format(summary.totalOwed),
					tone: summary.totalOwed > 0 ? "negative" : "neutral",
				},
				{
					label: "Monthly payments",
					value: format(summary.totalMonthly),
				},
				{
					label: "Average rate",
					value: formatRate(summary.averageRate),
					note: "weighted by balance",
				},
				debtFreeItem(summary, format),
			]}
		/>
	);
}

/** "Debt-free by": the last payoff month, or why there isn't one. */
function debtFreeItem(
	summary: LoanSummary,
	format: (cents: number) => string,
): StatStripItem {
	const label = "Debt-free by";
	if (summary.stuckCount > 0) {
		const loans = summary.stuckCount === 1 ? "loan" : "loans";
		return {
			label,
			value: "Not on track",
			tone: "negative",
			note: `${summary.stuckCount} ${loans} won't pay off at the current payment`,
		};
	}
	if (!summary.debtFreeDate) {
		return { label, value: "Debt-free", tone: "positive" };
	}
	return {
		label,
		value: formatMonthYear(summary.debtFreeDate),
		tone: "positive",
		note: `${format(summary.interestLeft)} interest left to pay`,
	};
}
