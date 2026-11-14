import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { upsertUserExpense } from "#/database/expenses/queries.expenses";
import { expenseValuesSchema } from "#/database/expenses/schemas.expenses";
import { authMiddleware } from "#/lib/auth-middleware";

const addExpenseInput = expenseValuesSchema.extend({
	account_id: z.uuid(),
	/** Pass an existing expense's id to edit it instead of creating a new one. */
	expense_id: z.uuid().optional(),
});

export type AddExpenseInput = z.input<typeof addExpenseInput>;

/**
 * Creates an expense on a finance account, or edits one when `expense_id` is
 * given. Requires an owner, admin, or member role on the account.
 */
export const addExpenseFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(addExpenseInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			user_id: context.user.sub,
			account_id: data.account_id,
			roles: WRITE_ROLES,
		});
		const expense = await upsertUserExpense(data);
		// null means `expense_id` exists but belongs to a different account.
		if (!expense) throw new Error("Expense not found");
		return expense;
	});
