import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import type {
	Granularity,
	PeriodCount,
	ProjectionCount,
} from "#/database/reports/constants.reports";
import { getReportFn } from "#/database/reports/server-fn/get-report";

export const reportKeys = {
	all: (accountId: string) => ["report", accountId] as const,
	detail: (
		accountId: string,
		granularity: Granularity,
		periodCount: PeriodCount,
		projectionCount: ProjectionCount,
	) =>
		[
			...reportKeys.all(accountId),
			granularity,
			periodCount,
			projectionCount,
		] as const,
};

/**
 * Income, expenses and net worth on a finance account, grouped by period and
 * by source/category, plus `projectionCount` projected periods. Idle until `accountId` is set. Keeps showing the
 * previous report while a new granularity or range loads, so the charts
 * don't flash empty. Income, expense and asset mutations invalidate this.
 */
export function useReport(
	accountId: string | undefined,
	granularity: Granularity,
	periodCount: PeriodCount,
	projectionCount: ProjectionCount,
) {
	return useQuery({
		queryKey: reportKeys.detail(
			accountId ?? "",
			granularity,
			periodCount,
			projectionCount,
		),
		queryFn: accountId
			? () =>
					getReportFn({
						data: { accountId, granularity, periodCount, projectionCount },
					})
			: skipToken,
		placeholderData: keepPreviousData,
	});
}
