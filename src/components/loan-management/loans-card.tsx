import { Landmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AssetTableSkeleton } from "#/components/asset-management/asset-table/asset-table-skeleton";
import { EmptyState } from "#/components/common/empty-state";
import { ErrorAlert } from "#/components/common/error-alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { canWrite } from "#/database/accounts/roles";
import type { LoanRow } from "#/database/loans/queries.loans";
import { useLoans, useRemoveLoan } from "#/hooks/loans/use-loans";
import { LoanFormSheet } from "./loan-form-sheet";
import { LoanPaymentsSheet } from "./loan-payments-sheet";
import { LoanTable } from "./loan-table/loan-table";

interface ILoansCard {
	account: UserAccountRow;
}

/**
 * Lists the account's loans. Anyone can open a loan's payment history;
 * users who can write can also record payments, edit and delete.
 */
export function LoansCard({ account }: ILoansCard) {
	const loans = useLoans(account.id);
	const removeLoan = useRemoveLoan(account.id);
	const editable = canWrite(account.role);

	/** Loan open in the edit sheet. */
	const [editing, setEditing] = useState<LoanRow>();
	/**
	 * Id (not the row) of the loan open in the payments sheet, so the sheet
	 * always shows the latest balance after a payment is recorded or deleted.
	 */
	const [paymentsLoanId, setPaymentsLoanId] = useState<string>();
	const paymentsLoan = loans.data?.find((l) => l.id === paymentsLoanId);

	/**
	 * Deleting a loan unlinks its payments from it for good (they stay as
	 * ordinary expenses), so ask first instead of offering an undo.
	 */
	function handleDelete(loan: LoanRow) {
		toast.warning(`Delete ${loan.name}?`, {
			description:
				loan.payment_count > 0
					? "Its payments stay in your expenses but are no longer linked to a loan. This can't be undone."
					: "This can't be undone.",
			// Long enough to read and decide; it closes as "Cancel" otherwise.
			duration: 10_000,
			action: {
				label: "Delete",
				onClick: () =>
					removeLoan.mutate(loan.id, {
						onSuccess: () => toast.success(`Deleted ${loan.name}`),
						onError: (error) =>
							toast.error("Couldn't delete the loan", {
								description: error.message,
							}),
					}),
			},
			cancel: { label: "Cancel", onClick: () => {} },
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{account.name} loans</CardTitle>
				<CardDescription>
					{editable
						? "Track what you owe, record payments against each loan, and see when it will be paid off."
						: "You have view-only access to this account."}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loans.isPending ? (
					<AssetTableSkeleton />
				) : loans.isError ? (
					<ErrorAlert title="Couldn't load your loans" error={loans.error} />
				) : loans.data.length === 0 ? (
					<EmptyState
						icon={Landmark}
						title="No loans yet"
						description="Loans you add from the toolbar will show up here, including ones you're already paying off."
					/>
				) : (
					<LoanTable
						loans={loans.data}
						currency={account.base_currency}
						canEdit={editable}
						onPayments={(loan) => setPaymentsLoanId(loan.id)}
						onEdit={setEditing}
						onDelete={handleDelete}
					/>
				)}
			</CardContent>

			<LoanFormSheet
				account={account}
				open={editing !== undefined}
				loan={editing}
				onClose={() => setEditing(undefined)}
			/>
			<LoanPaymentsSheet
				account={account}
				loan={paymentsLoan}
				canEdit={editable}
				onClose={() => setPaymentsLoanId(undefined)}
			/>
		</Card>
	);
}
