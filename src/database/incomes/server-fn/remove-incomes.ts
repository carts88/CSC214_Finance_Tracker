import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { removeUserIncomes } from "#/database/incomes/queries.incomes";
import { authMiddleware } from "#/lib/auth-middleware";

const removeIncomesInput = z.object({
	accountId: z.uuid(),
	incomeIds: z.array(z.uuid()).min(1),
});

/**
 * Deletes several incomes from a finance account and returns the deleted
 * rows. Requires an owner, admin, or member role on the account.
 */
export const removeIncomesFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(removeIncomesInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		return removeUserIncomes(data);
	});
