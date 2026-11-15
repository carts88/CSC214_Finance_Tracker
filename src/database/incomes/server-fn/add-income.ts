import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { upsertUserIncome } from "#/database/incomes/queries.incomes";
import { incomeValuesSchema } from "#/database/incomes/schemas.incomes";
import { authMiddleware } from "#/lib/auth-middleware";

const addIncomeInput = incomeValuesSchema.extend({
	accountId: z.uuid(),
	/** Pass an existing income's id to edit it instead of creating a new one. */
	incomeId: z.uuid().optional(),
});

export type AddIncomeInput = z.input<typeof addIncomeInput>;

/**
 * Creates an income on a finance account, or edits one when `incomeId` is
 * given. Requires an owner, admin, or member role on the account.
 */
export const addIncomeFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(addIncomeInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const income = await upsertUserIncome(data);
		// null means `incomeId` exists but belongs to a different account.
		if (!income) throw new Error("Income not found");
		return income;
	});
