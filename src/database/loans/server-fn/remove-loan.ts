import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { removeUserLoan } from "#/database/loans/queries.loans";
import { authMiddleware } from "#/lib/auth-middleware";

const removeLoanInput = z.object({
	accountId: z.uuid(),
	loanId: z.uuid(),
});

/**
 * Deletes a loan from a finance account and returns its id. Its autopay
 * stops and its payments stay as ordinary expenses. Requires an owner,
 * admin, or member role on the account.
 */
export const removeLoanFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(removeLoanInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const loan = await removeUserLoan(data);
		if (!loan) throw new Error("Loan not found");
		return loan;
	});
