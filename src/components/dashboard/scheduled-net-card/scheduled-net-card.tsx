import { ErrorAlert } from "#/components/common/error-alert";
import { StatBreakdown } from "#/components/common/stats/stat-breakdown";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import {
	SCHEDULE_WINDOWS,
	scheduleWindowKey,
} from "#/database/finances/constants.finances";
import { useDashboard } from "#/hooks/dashboard/use-dashboard";
import { formatCents } from "#/lib/utils/formatters/currency";

interface IScheduledNetCard {
	account: UserAccountRow;
}

/**
 * Scheduled income minus scheduled expenses over each look-ahead window:
 * green "+$120.00" for a profit, red "-$40.00" for a loss.
 */
export function ScheduledNetCard({ account }: IScheduledNetCard) {
	const dashboard = useDashboard(account.id);
	const summary = dashboard.data?.summary;

	const windows = SCHEDULE_WINDOWS.map((days) => {
		const net = summary
			? summary[scheduleWindowKey("income", days)] -
				summary[scheduleWindowKey("expense", days)]
			: 0;
		return { days, net };
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Scheduled net profit / loss</CardTitle>
				<CardDescription>
					Scheduled income minus scheduled expenses.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{dashboard.isError ? (
					<ErrorAlert
						title="Couldn't load the scheduled net"
						error={dashboard.error}
					/>
				) : (
					<StatBreakdown
						loading={!summary}
						items={windows.map(({ days, net }) => ({
							label: `Next ${days} days`,
							value: `${net > 0 ? "+" : ""}${formatCents(net, account.base_currency)}`,
							tone: net > 0 ? "positive" : net < 0 ? "negative" : "neutral",
						}))}
					/>
				)}
			</CardContent>
		</Card>
	);
}
