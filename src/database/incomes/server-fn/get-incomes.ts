import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccountAccess } from "#/database/accounts/queries.account-access";
import { getUserIncomes } from "#/database/incomes/queries.incomes";
import { authMiddleware } from "#/lib/auth-middleware";

const getIncomesInput = z.object({
	accountId: z.uuid(),
});

/**
 * Returns every income on a finance account, newest first.
 * Any active member of the account (including viewers) can read.
 */
export const getIncomesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(getIncomesInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
		});
		return getUserIncomes({ accountId: data.accountId });
	});
