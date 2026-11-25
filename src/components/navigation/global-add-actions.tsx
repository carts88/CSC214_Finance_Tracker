import { useState } from "react";
import { useActiveAccount } from "#/components/accounts/active-account-context";
import { AssetFormSheet } from "#/components/asset-management/assets-card/asset-form-sheet";
import { AddTransactionButtons } from "#/components/common/add-transaction-buttons";
import { ExpenseFormSheet } from "#/components/expense-management/expenses-card/expense-form-sheet";
import { IncomeFormSheet } from "#/components/income-management/incomes-card/income-form-sheet";
import { LoanFormSheet } from "#/components/loan-management/loan-form-sheet";
import { canWrite } from "#/database/accounts/roles";

type Adding = "income" | "expense" | "asset" | "loan";

/**
 * The "Add income / expense / asset / loan" buttons shown in the top toolbar
 * on every page, plus the slide-over forms they open. They add to the account
 * picked in the page's account picker. Hidden for read-only accounts.
 */
export function GlobalAddActions() {
	const { account } = useActiveAccount();
	const [adding, setAdding] = useState<Adding | null>(null);

	if (!account || !canWrite(account.role)) return null;

	const close = () => setAdding(null);

	return (
		<>
			<AddTransactionButtons
				onAddIncome={() => setAdding("income")}
				onAddExpense={() => setAdding("expense")}
				onAddAsset={() => setAdding("asset")}
				onAddLoan={() => setAdding("loan")}
			/>

			{/* Remount per account so the forms reset on switch. */}
			<div key={account.id} className="contents">
				<IncomeFormSheet
					account={account}
					open={adding === "income"}
					onClose={close}
				/>
				<ExpenseFormSheet
					account={account}
					open={adding === "expense"}
					onClose={close}
				/>
				<AssetFormSheet
					account={account}
					open={adding === "asset"}
					onClose={close}
				/>
				<LoanFormSheet
					account={account}
					open={adding === "loan"}
					onClose={close}
				/>
			</div>
		</>
	);
}
