import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { ErrorAlert } from "#/components/common/error-alert";
import { StatBreakdown } from "#/components/common/stats/stat-breakdown";
import { StatCard } from "#/components/common/stats/stat-card";
import { StatGrid } from "#/components/common/stats/stat-grid";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { useDashboard } from "#/hooks/dashboard/use-dashboard";
import { formatCents } from "#/lib/utils/formatters/currency";

interface IDashboardStats {
	account: UserAccountRow;
}

/** Total money, income, and expense headline cards for an account. */
export function DashboardStats({ account }: IDashboardStats) {
	const dashboard = useDashboard(account.id);
	if (dashboard.isError) {
		return <ErrorAlert title="Couldn't load totals" error={dashboard.error} />;
	}

	const summary = dashboard.data?.summary;
	const loading = !summary;
	const money = (cents: number | undefined, negative = false) =>
		cents === undefined
			? null
			: formatCents(cents, account.base_currency, { negative });

	return (
		<StatGrid columns={3}>
			<StatCard
				label="Total money"
				icon={Wallet}
				value={money(summary?.total_money)}
				tone={summary && summary.total_money < 0 ? "negative" : "neutral"}
				description="Income minus expenses, to date"
				loading={loading}
			/>
			<StatCard
				label="Income"
				icon={TrendingUp}
				tone="positive"
				value={money(summary?.income_this_month)}
				description="This month"
				loading={loading}
				breakdown={
					<StatBreakdown
						loading={loading}
						items={[
							{ label: "All-time", value: money(summary?.income_to_date) },
						]}
					/>
				}
			/>
			<StatCard
				label="Expenses"
				icon={TrendingDown}
				tone="negative"
				value={money(summary?.expense_this_month, true)}
				description="This month"
				loading={loading}
				breakdown={
					<StatBreakdown
						loading={loading}
						items={[
							{
								label: "All-time",
								value: money(summary?.expense_to_date, true),
							},
						]}
					/>
				}
			/>
		</StatGrid>
	);
}
