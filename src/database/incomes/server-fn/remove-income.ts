import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { removeUserIncome } from "#/database/incomes/queries.incomes";
import { authMiddleware } from "#/lib/auth-middleware";

const removeIncomeInput = z.object({
	accountId: z.uuid(),
	incomeId: z.uuid(),
});

/**
 * Deletes an income from a finance account and returns the deleted row.
 * Requires an owner, admin, or member role on the account.
 */
export const removeIncomeFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(removeIncomeInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const income = await removeUserIncome(data);
		if (!income) throw new Error("Income not found");
		return income;
	});
