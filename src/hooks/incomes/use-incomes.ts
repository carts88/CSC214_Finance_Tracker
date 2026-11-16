import {
	type QueryClient,
	skipToken,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import type { IncomeValues } from "#/database/incomes/schemas.incomes";
import { addIncomeFn } from "#/database/incomes/server-fn/add-income";
import { getIncomesFn } from "#/database/incomes/server-fn/get-incomes";
import { removeIncomeFn } from "#/database/incomes/server-fn/remove-income";
import { removeIncomesFn } from "#/database/incomes/server-fn/remove-incomes";
import { stopRecurringIncomeFn } from "#/database/incomes/server-fn/stop-recurring-income";
import { dashboardKeys } from "#/hooks/dashboard/use-dashboard";
import { occurrencesBetween } from "#/lib/utils/helpers/recurrence";

export const incomeKeys = {
	list: (accountId: string) => ["incomes", accountId] as const,
};

/**
 * Refetches the account's income list and its dashboard, which aggregates
 * incomes. Called after every income mutation.
 */
function invalidateIncomes(queryClient: QueryClient, accountId: string) {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: incomeKeys.list(accountId) }),
		queryClient.invalidateQueries({ queryKey: dashboardKeys.all(accountId) }),
	]);
}

/**
 * All incomes on a finance account, newest first. A recurring income is one
 * row for its whole series. Idle until `accountId` is set.
 */
export function useIncomes(accountId: string | undefined) {
	return useQuery({
		queryKey: incomeKeys.list(accountId ?? ""),
		queryFn: accountId
			? () => getIncomesFn({ data: { accountId } })
			: skipToken,
	});
}

/**
 * Whole cents earned this calendar month, or undefined while incomes load.
 * A repeating income counts once for every time it happens this month.
 * Reuses the `useIncomes` data, so it doesn't make an extra request.
 */
export function useIncomeMonthTotal(accountId: string | undefined) {
	const incomes = useIncomes(accountId);
	if (!incomes.data) return undefined;

	const today = new Date();
	const from = format(startOfMonth(today), "yyyy-MM-dd");
	const to = format(endOfMonth(today), "yyyy-MM-dd");

	let total = 0;
	for (const income of incomes.data) {
		const times = occurrencesBetween(income, from, to).length;
		total += income.amount * times;
	}
	return total;
}

/**
 * Creates an income, or updates one when `incomeId` is passed. Refetches
 * the account's income list afterwards.
 */
export function useSaveIncome(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: IncomeValues & { incomeId?: string }) =>
			addIncomeFn({ data: { ...values, accountId } }),
		onSettled: () => invalidateIncomes(queryClient, accountId),
	});
}

/** Deletes an income (a whole series if recurring), then refetches. */
export function useRemoveIncome(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (incomeId: string) =>
			removeIncomeFn({ data: { accountId, incomeId } }),
		onSettled: () => invalidateIncomes(queryClient, accountId),
	});
}

/** Deletes several incomes at once, then refetches. */
export function useRemoveIncomes(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (incomeIds: string[]) =>
			removeIncomesFn({ data: { accountId, incomeIds } }),
		onSettled: () => invalidateIncomes(queryClient, accountId),
	});
}

/** Ends a recurring income today, then refetches. */
export function useStopRecurringIncome(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (incomeId: string) =>
			stopRecurringIncomeFn({ data: { accountId, incomeId } }),
		onSettled: () => invalidateIncomes(queryClient, accountId),
	});
}
