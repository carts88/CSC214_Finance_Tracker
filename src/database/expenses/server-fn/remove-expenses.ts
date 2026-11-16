import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { removeUserExpenses } from "#/database/expenses/queries.expenses";
import { authMiddleware } from "#/lib/auth-middleware";

const removeExpensesInput = z.object({
	accountId: z.uuid(),
	expenseIds: z.array(z.uuid()).min(1),
});

/**
 * Deletes several expenses from a finance account and returns the deleted
 * rows. Requires an owner, admin, or member role on the account.
 */
export const removeExpensesFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(removeExpensesInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		return removeUserExpenses(data);
	});
