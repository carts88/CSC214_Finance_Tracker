import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccountAccess } from "#/database/accounts/queries.account-access";
import {
	GRANULARITIES,
	PERIOD_COUNTS,
	PROJECTION_COUNTS,
} from "#/database/reports/constants.reports";
import { getReport } from "#/database/reports/queries.reports";
import { authMiddleware } from "#/lib/auth-middleware";

const getReportInput = z.object({
	accountId: z.uuid(),
	granularity: z.enum(GRANULARITIES),
	periodCount: z
		.number()
		.int()
		.refine((n) => (PERIOD_COUNTS as readonly number[]).includes(n)),
	projectionCount: z
		.number()
		.int()
		.refine((n) => (PROJECTION_COUNTS as readonly number[]).includes(n)),
});

/**
 * Income, expenses and net worth on a finance account, grouped by time
 * period and by source/category, optionally projected forward. Any active member of the account
 * (including viewers) can read.
 */
export const getReportFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(getReportInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
		});
		return getReport(data);
	});
