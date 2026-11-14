import {
	skipToken,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import type { ExpenseValues } from "#/database/expenses/schemas.expenses";
import { addExpenseFn } from "#/database/expenses/server-fn/add-expense";
import { getExpenseSummaryFn } from "#/database/expenses/server-fn/get-expense-summary";
import { getExpensesFn } from "#/database/expenses/server-fn/get-expenses";
import { removeExpenseFn } from "#/database/expenses/server-fn/remove-expense";
import { stopRecurringExpenseFn } from "#/database/expenses/server-fn/stop-recurring-expense";

export const expenseKeys = {
	all: ["expenses"] as const,
	/** Everything cached for one account (the list and its summaries). */
	account: (accountId: string) => ["expenses", accountId] as const,
	list: (accountId: string) => ["expenses", accountId, "list"] as const,
	summary: (accountId: string, from: string, to: string) =>
		["expenses", accountId, "summary", from, to] as const,
};

/**
 * All expenses on a finance account, newest first. A recurring expense is one
 * row for its whole series. Idle until `accountId` is set.
 */
export function useExpenses(accountId: string | undefined) {
	return useQuery({
		queryKey: expenseKeys.list(accountId ?? ""),
		queryFn: accountId
			? () => getExpensesFn({ data: { accountId } })
			: skipToken,
	});
}

/**
 * Total spent this calendar month (in the viewer's timezone), counting every
 * occurrence of recurring expenses that falls in the month.
 */
export function useExpenseSummary(accountId: string | undefined) {
	const today = new Date();
	const from = format(startOfMonth(today), "yyyy-MM-dd");
	const to = format(endOfMonth(today), "yyyy-MM-dd");
	return useQuery({
		queryKey: expenseKeys.summary(accountId ?? "", from, to),
		queryFn: accountId
			? () => getExpenseSummaryFn({ data: { accountId, from, to } })
			: skipToken,
	});
}

/**
 * Creates an expense, or updates one when `expenseId` is passed. Refetches
 * the account's expense list and summaries afterwards.
 */
export function useSaveExpense(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: ExpenseValues & { expenseId?: string }) =>
			addExpenseFn({ data: { ...values, accountId } }),
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: expenseKeys.account(accountId),
			}),
	});
}

/** Deletes an expense (a whole series if recurring), then refetches. */
export function useRemoveExpense(accountId: string) {
	const queryClient = useQueryClient(); // get the query client to manage cache and refetching
	return useMutation({
		mutationFn: (expenseId: string) =>
			removeExpenseFn({ data: { accountId, expenseId } }), // calls the server function to remove the expense
		onSettled: () =>
			// once the mutation is settled (either success or error), invalidate the account's expense queries to refetch them, so stale info is not shown.
			queryClient.invalidateQueries({
				queryKey: expenseKeys.account(accountId),
			}),
	});
}

/** Ends a recurring expense today, then refetches. */
export function useStopRecurringExpense(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (expenseId: string) =>
			stopRecurringExpenseFn({ data: { accountId, expenseId } }),
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: expenseKeys.account(accountId),
			}),
	});
}
