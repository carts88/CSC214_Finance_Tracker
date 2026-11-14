import {
	skipToken,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { ExpenseValues } from "#/database/expenses/schemas.expenses";
import { addExpenseFn } from "#/database/expenses/server-fn/add-expense";
import { getExpensesFn } from "#/database/expenses/server-fn/get-expenses";
import { removeExpenseFn } from "#/database/expenses/server-fn/remove-expense";

export const expenseKeys = {
	all: ["expenses"] as const,
	list: (accountId: string) => ["expenses", accountId] as const,
};

/** All expenses on a finance account, newest first. Idle until `accountId` is set. */
export function useExpenses(accountId: string | undefined) {
	return useQuery({
		queryKey: expenseKeys.list(accountId ?? ""),
		queryFn: accountId
			? () => getExpensesFn({ data: { accountId } })
			: skipToken,
	});
}

/**
 * Creates an expense, or updates one when `expenseId` is passed. Refetches
 * the account's expense list afterwards.
 */
export function useSaveExpense(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: ExpenseValues & { expenseId?: string }) =>
			addExpenseFn({ data: { ...values, accountId } }),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: expenseKeys.list(accountId) }),
	});
}

/** Deletes an expense, then refetches the account's expense list. */
export function useRemoveExpense(accountId: string) {
	const queryClient = useQueryClient(); // get the query client to manage cache and refetching
	return useMutation({
		mutationFn: (expenseId: string) =>
			removeExpenseFn({ data: { accountId, expenseId } }), // calls the server function to remove the expense
		onSettled: () =>
			// once the mutation is settled (either success or error), invalidate the query for the expense list to refetch it, so stale info is not shown.
			queryClient.invalidateQueries({ queryKey: expenseKeys.list(accountId) }),
	});
}
