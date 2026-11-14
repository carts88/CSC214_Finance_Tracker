import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { upsertUserExpense } from "#/database/expenses/queries.expenses";
import { authMiddleware } from "#/lib/auth-middleware";

const addExpenseInput = z.object({
	accountId: z.uuid(),
	/** Pass an existing expense's id to edit it instead of creating a new one. */
	expenseId: z.uuid().optional(),
	/** Whole cents, e.g. $12.50 -> 1250. */
	amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
	/** Calendar date as 'YYYY-MM-DD'. */
	occurredOn: z.iso.date(),
	category: z.string().trim().min(1).max(100),
	description: z
		.string()
		.trim()
		.max(500)
		.nullish()
		.transform((value) => value || null),
});

export type AddExpenseInput = z.input<typeof addExpenseInput>;

/**
 * Creates an expense on a finance account, or edits one when `expenseId` is
 * given. Requires an owner, admin, or member role on the account.
 */
export const addExpenseFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(addExpenseInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const expense = await upsertUserExpense(data);
		// null means `expenseId` exists but belongs to a different account.
		if (!expense) throw new Error("Expense not found");
		return expense;
	});
