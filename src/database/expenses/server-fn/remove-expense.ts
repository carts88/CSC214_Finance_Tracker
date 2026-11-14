import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { removeUserExpense } from "#/database/expenses/queries.expenses";
import { authMiddleware } from "#/lib/auth-middleware";

const removeExpenseInput = z.object({
	accountId: z.uuid(),
	expenseId: z.uuid(),
});

/**
 * Deletes an expense from a finance account and returns the deleted row.
 * Requires an owner, admin, or member role on the account.
 */
export const removeExpenseFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(removeExpenseInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const expense = await removeUserExpense(data);
		if (!expense) throw new Error("Expense not found");
		return expense;
	});
