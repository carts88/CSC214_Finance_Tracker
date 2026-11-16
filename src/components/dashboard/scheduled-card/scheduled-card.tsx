import { Banknote, CalendarClock, Receipt, Repeat } from "lucide-react";
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
	type ScheduleKind,
	scheduleWindowKey,
	UPCOMING_DAYS,
} from "#/database/finances/constants.finances";
import { useDashboard } from "#/hooks/dashboard/use-dashboard";
import { formatCents } from "#/lib/utils/formatters/currency";
import { formatDate } from "#/lib/utils/formatters/dates";

/** The wording, colour, and data that differ between the two cards. */
const KINDS = {
	income: {
		title: "Scheduled income",
		description: "What's coming in, including every repeat.",
		listLabel: `Expected in the next ${UPCOMING_DAYS} days`,
		emptyTitle: "Nothing expected soon",
		tone: "positive",
		oneOffIcon: Banknote,
		negative: false,
		upcoming: "upcomingIncomes",
	},
	expense: {
		title: "Scheduled expenses",
		description: "What's due, including every repeat.",
		listLabel: `Due in the next ${UPCOMING_DAYS} days`,
		emptyTitle: "Nothing due soon",
		tone: "negative",
		oneOffIcon: Receipt,
		negative: true,
		upcoming: "upcomingExpenses",
	},
} as const;

interface IScheduledCard {
	account: UserAccountRow;
	kind: ScheduleKind;
}

/**
 * Income or expense totals over the coming windows, plus the dated list of
 * what's scheduled.
 */
export function ScheduledCard({ account, kind }: IScheduledCard) {
	const config = KINDS[kind];
	const dashboard = useDashboard(account.id);
	const summary = dashboard.data?.summary;
	const upcoming = dashboard.data?.[config.upcoming];
	const money = (cents: number) =>
		formatCents(cents, account.base_currency, { negative: config.negative });

	return (
		<Card>
			<CardHeader>
				<CardTitle>{config.title}</CardTitle>
				<CardDescription>{config.description}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{dashboard.isError ? (
					<ErrorAlert
						title={`Couldn't load ${config.title.toLowerCase()}`}
						error={dashboard.error}
					/>
				) : (
					<>
						<StatBreakdown
							loading={!summary}
							items={SCHEDULE_WINDOWS.map((days) => ({
								label: `Next ${days} days`,
								value: summary
									? money(summary[scheduleWindowKey(kind, days)])
									: null,
								tone: config.tone,
							}))}
						/>

						<Separator />

						<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							{config.listLabel}
						</span>
						{upcoming?.length === 0 ? (
							<EmptyState icon={CalendarClock} title={config.emptyTitle} />
						) : (
							<ItemList
								loading={dashboard.isPending}
								className="max-h-80"
								items={(upcoming ?? []).map((item) => ({
									// A series appears once per date, so id alone isn't unique.
									key: `${item.id}-${item.on_date}`,
									icon: item.frequency === "never" ? config.oneOffIcon : Repeat,
									title: item.description || item.label,
									subtitle: item.description
										? `${formatDate(item.on_date)} · ${item.label}`
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
