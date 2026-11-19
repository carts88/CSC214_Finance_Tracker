import { ErrorAlert } from "#/components/common/error-alert";
import {
	StatStrip,
	type StatStripItem,
} from "#/components/common/stats/stat-strip";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { useDashboard } from "#/hooks/dashboard/use-dashboard";
import { useMoney } from "#/hooks/use-money";

interface IDashboardStats {
	account: UserAccountRow;
}

/** The headline cells with empty values, for the page's loading state. */
const PLACEHOLDER_ITEMS: StatStripItem[] = [
	{ label: "Net worth", value: null, note: null },
	{ label: "Total money", value: null, note: null },
	{ label: "Income", value: null, note: null },
	{ label: "Expenses", value: null, note: null },
];

/** Net worth, total money, income, and expenses in one compact strip. */
export function DashboardStats({ account }: IDashboardStats) {
	const dashboard = useDashboard(account.id);
	const { format } = useMoney(account.base_currency);
	if (dashboard.isError) {
		return <ErrorAlert title="Couldn't load totals" error={dashboard.error} />;
	}

	const summary = dashboard.data?.summary;
	if (!summary) return <DashboardStatsSkeleton />;

	const money = (cents: number, negative = false) =>
		format(cents, { negative });

	return (
		<StatStrip
			items={[
				{
					label: "Net worth",
					value: money(summary.net_worth),
					tone: summary.net_worth < 0 ? "negative" : "neutral",
					note:
						summary.asset_count > 0
							? `Incl. ${money(summary.asset_total)} in assets`
							: "No assets",
				},
				{
					label: "Total money",
					value: money(summary.total_money),
					tone: summary.total_money < 0 ? "negative" : "neutral",
					note: "Income minus expenses",
				},
				{
					label: "Income",
					value: money(summary.income_this_month),
					tone: "positive",
					note: `This month · ${money(summary.income_to_date)} all-time`,
				},
				{
					label: "Expenses",
					value: money(summary.expense_this_month, true),
					tone: "negative",
					note: `This month · ${money(summary.expense_to_date, true)} all-time`,
				},
			]}
		/>
	);
}

export function DashboardStatsSkeleton() {
	return <StatStrip items={PLACEHOLDER_ITEMS} loading />;
}
