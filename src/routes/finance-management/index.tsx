import { useSession } from "@better-auth-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountPicker } from "#/components/accounts/account-picker";
import { AddTransactionButtons } from "#/components/common/add-transaction-buttons";
import { ErrorAlert } from "#/components/common/error-alert";
import { ExpenseFormSheet } from "#/components/expense-management/expenses-card/expense-form-sheet";
import { ExpensesCard } from "#/components/expense-management/expenses-card/expenses-card";
import { ExpensesCardSkeleton } from "#/components/expense-management/expenses-card/expenses-card-skeleton";
import { IncomeFormSheet } from "#/components/income-management/incomes-card/income-form-sheet";
import { IncomesCard } from "#/components/income-management/incomes-card/incomes-card";
import { IncomesCardSkeleton } from "#/components/income-management/incomes-card/incomes-card-skeleton";
import { HeaderActions } from "#/components/navigation/header-actions";
import { canWrite } from "#/database/accounts/roles";
import { useMyAccounts } from "#/hooks/accounts/use-my-accounts";
import { authClient } from "#/lib/auth-client";



export const Route = createFileRoute("/finance-management/")({
	component: ExpenseManagementPage,
});

function ExpenseManagementPage() {
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
	const account =
		accounts.data?.find((a) => a.id === selectedId) ?? accounts.data?.[0];

	if (!session) return null;

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">


			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Finance Management</h1>
				{accounts.data && accounts.data.length > 1 && account && (
					<AccountPicker
						accounts={accounts.data}
						value={account.id}
						onChange={setSelectedId}
					/>
				)}
				
			</div>

			{account && canWrite(account.role) && (
				<HeaderActions>
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
					<IncomesCard account={account} />
					<ExpensesCard account={account} />

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
					<IncomesCardSkeleton />
					<ExpensesCardSkeleton />
				</>
			)}
		</div>
	);
}
