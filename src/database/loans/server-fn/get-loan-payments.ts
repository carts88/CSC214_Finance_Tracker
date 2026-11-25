import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccountAccess } from "#/database/accounts/queries.account-access";
import { getLoanPayments } from "#/database/loans/queries.loans";
import { authMiddleware } from "#/lib/auth-middleware";

const getLoanPaymentsInput = z.object({
	accountId: z.uuid(),
	loanId: z.uuid(),
});

/**
 * Returns every payment on a loan, newest first.
 * Any active member of the account (including viewers) can read.
 */
export const getLoanPaymentsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(getLoanPaymentsInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
		});
		return getLoanPayments(data);
	});
