import { CalendarClock, Receipt, Repeat } from "lucide-react";
import { EmptyState } from "#/components/common/empty-state";
import { ErrorAlert } from "#/components/common/error-alert";
import { ItemList } from "#/components/common/item-list";
import { StatBreakdown } from "#/components/common/stats/stat-breakdown";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import {
	SCHEDULE_WINDOWS,
	scheduleWindowKey,
	UPCOMING_DAYS,
} from "#/database/finances/constants.finances";
import { useDashboard } from "#/hooks/dashboard/use-dashboard";
import { formatCents } from "#/lib/utils/formatters/currency";
import { formatDate } from "#/lib/utils/formatters/dates";

interface IScheduledExpensesCard {
	account: UserAccountRow;
}

/** Expense totals over the coming windows, plus the dated list of what's due. */
export function ScheduledExpensesCard({ account }: IScheduledExpensesCard) {
	const dashboard = useDashboard(account.id);
	const summary = dashboard.data?.summary;
	const money = (cents: number) =>
		formatCents(cents, account.base_currency, { negative: true });

	return (
		<Card>
			<CardHeader>
				<CardTitle>Scheduled expenses</CardTitle>
				<CardDescription>What's due, including every repeat.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{dashboard.isError ? (
					<ErrorAlert
						title="Couldn't load scheduled expenses"
						error={dashboard.error}
					/>
				) : (
					<>
						<StatBreakdown
							loading={!summary}
							items={SCHEDULE_WINDOWS.map((days) => ({
								label: `Next ${days} days`,
								value: summary ? money(summary[scheduleWindowKey(days)]) : null,
								tone: "negative" as const,
							}))}
						/>

						<Separator />

						<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							Due in the next {UPCOMING_DAYS} days
						</span>
						{dashboard.data?.upcoming.length === 0 ? (
							<EmptyState icon={CalendarClock} title="Nothing due soon" />
						) : (
							<ItemList
								loading={dashboard.isPending}
								className="max-h-80"
								items={(dashboard.data?.upcoming ?? []).map((item) => ({
									// A series appears once per date, so id alone isn't unique.
									key: `${item.id}-${item.on_date}`,
									icon: item.frequency === "never" ? Receipt : Repeat,
									title: item.description || item.category,
									subtitle: item.description
										? `${formatDate(item.on_date)} · ${item.category}`
										: formatDate(item.on_date),
									value: money(item.amount),
								}))}
							/>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
