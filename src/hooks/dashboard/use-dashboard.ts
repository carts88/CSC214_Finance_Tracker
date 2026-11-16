import { skipToken, useQuery } from "@tanstack/react-query";
import { getDashboardFn } from "#/database/finances/server-fn/get-dashboard";

export const dashboardKeys = {
	all: (accountId: string) => ["dashboard", accountId] as const,
};

/**
 * Dashboard data for a finance account: summary totals, active subscriptions,
 * and upcoming expenses. Idle until `accountId` is set. Income and expense
 * mutations invalidate this, so it stays in sync with edits.
 */
export function useDashboard(accountId: string | undefined) {
	return useQuery({
		queryKey: dashboardKeys.all(accountId ?? ""),
		queryFn: accountId
			? () => getDashboardFn({ data: { accountId } })
			: skipToken,
	});
}
