import {
	type QueryClient,
	skipToken,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import type { ExpenseValues } from "#/database/expenses/schemas.expenses";
import { addExpenseFn } from "#/database/expenses/server-fn/add-expense";
import { getExpensesFn } from "#/database/expenses/server-fn/get-expenses";
import { removeExpenseFn } from "#/database/expenses/server-fn/remove-expense";
import { removeExpensesFn } from "#/database/expenses/server-fn/remove-expenses";
import { stopRecurringExpenseFn } from "#/database/expenses/server-fn/stop-recurring-expense";
import { dashboardKeys } from "#/hooks/dashboard/use-dashboard";
import { reportKeys } from "#/hooks/reports/use-report";
import { occurrencesBetween } from "#/lib/utils/helpers/recurrence";

export const expenseKeys = {
	list: (accountId: string) => ["expenses", accountId] as const,
};

/**
 * Refetches the account's expense list and its dashboard, which aggregates
 * expenses. Called after every expense mutation.
 */
function invalidateExpenses(queryClient: QueryClient, accountId: string) {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: expenseKeys.list(accountId) }),
		queryClient.invalidateQueries({ queryKey: dashboardKeys.all(accountId) }),
		queryClient.invalidateQueries({ queryKey: reportKeys.all(accountId) }),
	]);
}

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
 * Whole cents spent this calendar month, or undefined while expenses load.
 * A repeating expense counts once for every time it happens this month.
 * Reuses the `useExpenses` data, so it doesn't make an extra request.
 */
export function useMonthTotal(accountId: string | undefined) {
	const expenses = useExpenses(accountId);
	if (!expenses.data) return undefined;

	const today = new Date();
	const from = format(startOfMonth(today), "yyyy-MM-dd");
	const to = format(endOfMonth(today), "yyyy-MM-dd");

	let total = 0;
	for (const expense of expenses.data) {
		const times = occurrencesBetween(expense, from, to).length;
		total += expense.amount * times;
	}
	return total;
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
		onSettled: () => invalidateExpenses(queryClient, accountId),
	});
}

/** Deletes an expense (a whole series if recurring), then refetches. */
export function useRemoveExpense(accountId: string) {
	const queryClient = useQueryClient(); // get the query client to manage cache and refetching
	return useMutation({
		mutationFn: (expenseId: string) =>
			removeExpenseFn({ data: { accountId, expenseId } }), // calls the server function to remove the expense
		onSettled: () => invalidateExpenses(queryClient, accountId),
	});
}

/** Deletes several expenses at once, then refetches. */
export function useRemoveExpenses(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (expenseIds: string[]) =>
			removeExpensesFn({ data: { accountId, expenseIds } }),
		onSettled: () => invalidateExpenses(queryClient, accountId),
	});
}

/** Ends a recurring expense today, then refetches. */
export function useStopRecurringExpense(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (expenseId: string) =>
			stopRecurringExpenseFn({ data: { accountId, expenseId } }),
		onSettled: () => invalidateExpenses(queryClient, accountId),
	});
}
