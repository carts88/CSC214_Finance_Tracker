import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { stopRecurringExpense } from "#/database/expenses/queries.expenses";
import { authMiddleware } from "#/lib/auth-middleware";

const stopRecurringExpenseInput = z.object({
	accountId: z.uuid(),
	expenseId: z.uuid(),
});

/**
 * Stops a recurring expense so today's occurrence is its last, and returns
 * the updated row. Requires an owner, admin, or member role on the account.
 */
export const stopRecurringExpenseFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(stopRecurringExpenseInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const expense = await stopRecurringExpense(data);
		// null means it doesn't exist here, isn't recurring, or already ended.
		if (!expense) throw new Error("No active recurring expense to stop");
		return expense;
	});
