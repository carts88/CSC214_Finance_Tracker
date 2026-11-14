import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccountAccess } from "#/database/accounts/queries.account-access";
import { getUserExpenses } from "#/database/expenses/queries.expenses";
import { authMiddleware } from "#/lib/auth-middleware";

const getExpensesInput = z.object({
	accountId: z.uuid(),
});

/**
 * Returns every expense on a finance account, newest first.
 * Any active member of the account (including viewers) can read.
 */
export const getExpensesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(getExpensesInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
		});
		return getUserExpenses({ accountId: data.accountId });
	});
