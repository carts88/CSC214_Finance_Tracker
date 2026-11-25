import {
	skipToken,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { LoanValues } from "#/database/loans/schemas.loans";
import { addLoanFn } from "#/database/loans/server-fn/add-loan";
import { getLoanPaymentsFn } from "#/database/loans/server-fn/get-loan-payments";
import { getLoansFn } from "#/database/loans/server-fn/get-loans";
import { removeLoanFn } from "#/database/loans/server-fn/remove-loan";
import { invalidateExpenses } from "#/hooks/expenses/use-expenses";
import { loanKeys } from "#/hooks/loans/loan-keys";

// Loan payments are expenses: record one with useSaveExpense({ loanId }) and
// delete one with useRemoveExpense. Their refetch covers loans too.

/** All loans on a finance account. Idle until `accountId` is set. */
export function useLoans(accountId: string | undefined) {
	return useQuery({
		queryKey: loanKeys.list(accountId ?? ""),
		queryFn: accountId ? () => getLoansFn({ data: { accountId } }) : skipToken,
	});
}

/** Every payment on one loan, newest first. */
export function useLoanPayments(accountId: string, loanId: string) {
	return useQuery({
		queryKey: loanKeys.payments(accountId, loanId),
		queryFn: () => getLoanPaymentsFn({ data: { accountId, loanId } }),
	});
}

/**
 * Creates a loan, or updates one when `loanId` is passed. A loan's autopay
 * is an expense, so this refetches what expenses do (which includes loans).
 */
export function useSaveLoan(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: LoanValues & { loanId?: string }) =>
			addLoanFn({ data: { ...values, accountId } }),
		onSettled: () => invalidateExpenses(queryClient, accountId),
	});
}

/** Deletes a loan (its payments stay as ordinary expenses), then refetches. */
export function useRemoveLoan(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (loanId: string) =>
			removeLoanFn({ data: { accountId, loanId } }),
		onSettled: () => invalidateExpenses(queryClient, accountId),
	});
}
