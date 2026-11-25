import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccountAccess } from "#/database/accounts/queries.account-access";
import { getUserLoans } from "#/database/loans/queries.loans";
import { authMiddleware } from "#/lib/auth-middleware";

const getLoansInput = z.object({
	accountId: z.uuid(),
});

/**
 * Returns every loan on a finance account.
 * Any active member of the account (including viewers) can read.
 */
export const getLoansFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(getLoansInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
		});
		return getUserLoans({ accountId: data.accountId });
	});
