import { Repeat } from "lucide-react";
import { EmptyState } from "#/components/common/empty-state";
import { ErrorAlert } from "#/components/common/error-alert";
import { ItemList } from "#/components/common/item-list";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { frequencyLabel } from "#/database/schemas.recurrence";
import { useDashboard } from "#/hooks/dashboard/use-dashboard";
import { formatCents } from "#/lib/utils/formatters/currency";
import { formatDate } from "#/lib/utils/formatters/dates";

interface ISubscriptionsCard {
	account: UserAccountRow;
}

/** Recurring expenses that are still running, soonest charge first. */
export function SubscriptionsCard({ account }: ISubscriptionsCard) {
	const dashboard = useDashboard(account.id);
	const money = (cents: number) =>
		formatCents(cents, account.base_currency, { negative: true });

	return (
		<Card>
			<CardHeader>
				<CardTitle>Active subscriptions</CardTitle>
				<CardDescription>
					Recurring expenses that haven't ended.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{dashboard.isError ? (
					<ErrorAlert
						title="Couldn't load subscriptions"
						error={dashboard.error}
					/>
				) : dashboard.data?.subscriptions.length === 0 ? (
					<EmptyState
						icon={Repeat}
						title="No active subscriptions"
						description="Repeating expenses will show up here."
					/>
				) : (
					<ItemList
						loading={dashboard.isPending}
						items={(dashboard.data?.subscriptions ?? []).map((sub) => ({
							key: sub.id,
							title: sub.description || sub.category,
							subtitle: `${frequencyLabel(sub.frequency)} · next ${formatDate(sub.next_occurrence)}`,
							value: money(sub.amount),
							// Already per-month for monthly ones, so only show it for the rest.
							subvalue:
								sub.frequency === "monthly"
									? undefined
									: `≈ ${money(sub.monthly_cost)}/mo`,
						}))}
						footer={
							dashboard.data && {
								label: `${dashboard.data.subscriptions.length} active`,
								value: `≈ ${money(dashboard.data.summary.subscription_monthly_total)}/mo`,
							}
						}
					/>
				)}
			</CardContent>
		</Card>
	);
}
