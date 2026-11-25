import { useSession } from "@better-auth-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AccountPicker } from "#/components/accounts/account-picker";
import { useActiveAccount } from "#/components/accounts/active-account-context";
import { AssetsCard } from "#/components/asset-management/assets-card/assets-card";
import { AssetsCardSkeleton } from "#/components/asset-management/assets-card/assets-card-skeleton";
import { DeleteSelectedButton } from "#/components/common/delete-selected-button";
import { ErrorAlert } from "#/components/common/error-alert";
import {
	DashboardStats,
	DashboardStatsSkeleton,
} from "#/components/dashboard/dashboard-stats";
import { ScheduledExpensesCard } from "#/components/dashboard/scheduled-expenses-card/scheduled-expenses-card";
import { SubscriptionsCard } from "#/components/dashboard/subscriptions-card/subscriptions-card";
import { ExpensesCard } from "#/components/expense-management/expenses-card/expenses-card";
import { ExpensesCardSkeleton } from "#/components/expense-management/expenses-card/expenses-card-skeleton";
import { IncomesCard } from "#/components/income-management/incomes-card/incomes-card";
import { IncomesCardSkeleton } from "#/components/income-management/incomes-card/incomes-card-skeleton";
import { HeaderActions } from "#/components/navigation/header-actions";
import { canWrite } from "#/database/accounts/roles";
import { useTransactionSelection } from "#/hooks/use-transaction-selection";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
	const navigate = useNavigate();
	const { data: session, isFetching } = useSession(authClient);
	const signedOut = !session && !isFetching;

	useEffect(() => {
		if (signedOut) {
			void navigate({ to: "/auth/$path", params: { path: "sign-in" } });
		}
	}, [signedOut, navigate]);

	const { accounts, account, setAccountId } = useActiveAccount();
	/** Rows checked in each table; deleted together from the toolbar. */
	const selection = useTransactionSelection();

	function switchAccount(id: string) {
		setAccountId(id);
		selection.clear();
	}

	if (!session) return null;

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Dashboard</h1>
				{accounts.data && accounts.data.length > 1 && account && (
					<AccountPicker
						accounts={accounts.data}
						value={account.id}
						onChange={switchAccount}
					/>
				)}
			</div>

			{account && canWrite(account.role) && (
				<HeaderActions>
					<DeleteSelectedButton
						account={account}
						selectedIncomes={selection.incomes}
						selectedExpenses={selection.expenses}
						selectedAssets={selection.assets}
						onDeleted={selection.clear}
					/>
				</HeaderActions>
			)}

			{accounts.isError ? (
				<ErrorAlert
					title="Couldn't load your accounts"
					error={accounts.error}
				/>
			) : account ? (
				// Remount per account so the tables reset on switch.
				<div key={account.id} className="flex flex-col gap-6">
					<DashboardStats account={account} />

					{/*
					 * Two sides: the at-a-glance panel on the left, the wide tables
					 * on the right: the panel takes one column of four at xl, the
					 * tables the other three. Each side stacks on its own, so their
					 * cards never need matching heights.
					 */}
					<div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-x-4 xl:grid-cols-4">
						<aside className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
							<ScheduledExpensesCard account={account} />
							<SubscriptionsCard account={account} />
						</aside>
						<div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:col-start-2 lg:row-start-1 xl:col-span-3">
							<IncomesCard
								account={account}
								selected={selection.incomes}
								onSelectedChange={selection.setIncomes}
							/>
							<ExpensesCard
								account={account}
								selected={selection.expenses}
								onSelectedChange={selection.setExpenses}
							/>
							<AssetsCard
								account={account}
								selected={selection.assets}
								onSelectedChange={selection.setAssets}
							/>
						</div>
					</div>
				</div>
			) : (
				<>
					<DashboardStatsSkeleton />
					<IncomesCardSkeleton />
					<ExpensesCardSkeleton />
					<AssetsCardSkeleton />
				</>
			)}
		</div>
	);
}
