import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccountAccess } from "#/database/accounts/queries.account-access";
import { getAccountDashboard } from "#/database/finances/queries.finances";
import { authMiddleware } from "#/lib/auth-middleware";

const getDashboardInput = z.object({
	accountId: z.uuid(),
});

/**
 * Returns the dashboard summary, active subscriptions, and upcoming expenses
 * for a finance account. Any active member of the account (including viewers)
 * can read.
 */
export const getDashboardFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(getDashboardInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
		});
		return getAccountDashboard({ accountId: data.accountId });
	});
