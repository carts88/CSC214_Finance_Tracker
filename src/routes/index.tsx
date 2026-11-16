import { useSession } from "@better-auth-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountPicker } from "#/components/accounts/account-picker";
import { AddTransactionButtons } from "#/components/common/add-transaction-buttons";
import { DeleteSelectedButton } from "#/components/common/delete-selected-button";
import { ErrorAlert } from "#/components/common/error-alert";
import { StatCard } from "#/components/common/stats/stat-card";
import { StatGrid } from "#/components/common/stats/stat-grid";
import { DashboardStats } from "#/components/dashboard/dashboard-stats";
import { ScheduledCard } from "#/components/dashboard/scheduled-card/scheduled-card";
import { ScheduledNetCard } from "#/components/dashboard/scheduled-net-card/scheduled-net-card";
import { SubscriptionsCard } from "#/components/dashboard/subscriptions-card/subscriptions-card";
import { ExpenseFormSheet } from "#/components/expense-management/expenses-card/expense-form-sheet";
import { ExpensesCard } from "#/components/expense-management/expenses-card/expenses-card";
import { ExpensesCardSkeleton } from "#/components/expense-management/expenses-card/expenses-card-skeleton";
import { IncomeFormSheet } from "#/components/income-management/incomes-card/income-form-sheet";
import { IncomesCard } from "#/components/income-management/incomes-card/incomes-card";
import { IncomesCardSkeleton } from "#/components/income-management/incomes-card/incomes-card-skeleton";
import { HeaderActions } from "#/components/navigation/header-actions";
import { canWrite } from "#/database/accounts/roles";
import { useMyAccounts } from "#/hooks/accounts/use-my-accounts";
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

	const accounts = useMyAccounts();
	const [selectedId, setSelectedId] = useState<string>();
	/** Which "add" sheet the toolbar buttons opened, if any. */
	const [adding, setAdding] = useState<"income" | "expense" | null>(null);
	/** Rows checked in each table; deleted together from the toolbar. */
	const selection = useTransactionSelection();

	function switchAccount(id: string) {
		setSelectedId(id);
		selection.clear();
	}
	const account =
		accounts.data?.find((a) => a.id === selectedId) ?? accounts.data?.[0];

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
						onDeleted={selection.clear}
					/>
					<AddTransactionButtons
						onAddIncome={() => setAdding("income")}
						onAddExpense={() => setAdding("expense")}
					/>
				</HeaderActions>
			)}

			{accounts.isError ? (
				<ErrorAlert
					title="Couldn't load your accounts"
					error={accounts.error}
				/>
			) : account ? (
				// Remount per account so the open sheets and forms reset on switch.
				<div key={account.id} className="flex flex-col gap-6">
					<DashboardStats account={account} />

					{/*
					 * Two sides on the same 3-column grid as the stat cards (same
					 * gap-x-4 as StatGrid, so the edges line up): the at-a-glance
					 * panel under the 1st card, the wide tables under the 2nd and
					 * 3rd. Each side stacks on its own, so their cards never need
					 * matching heights.
					 */}
					<div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-x-4">
						<aside className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
							<ScheduledNetCard account={account} />
							<ScheduledCard account={account} kind="expense" />
							<ScheduledCard account={account} kind="income" />
						</aside>
						<div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:col-start-2 lg:row-start-1">
							<SubscriptionsCard account={account} />
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
						</div>
					</div>

					{/* "Add" sheets opened from the toolbar (they render as overlays). */}
					<IncomeFormSheet
						account={account}
						open={adding === "income"}
						onClose={() => setAdding(null)}
					/>
					<ExpenseFormSheet
						account={account}
						open={adding === "expense"}
						onClose={() => setAdding(null)}
					/>
				</div>
			) : (
				<>
					<StatGrid columns={3}>
						{["Total money", "Income", "Expenses"].map((label) => (
							<StatCard key={label} label={label} value={null} loading />
						))}
					</StatGrid>
					<IncomesCardSkeleton />
					<ExpensesCardSkeleton />
				</>
			)}
		</div>
	);
}
