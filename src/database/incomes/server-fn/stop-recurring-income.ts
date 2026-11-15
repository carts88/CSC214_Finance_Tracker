import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { stopRecurringIncome } from "#/database/incomes/queries.incomes";
import { authMiddleware } from "#/lib/auth-middleware";

const stopRecurringIncomeInput = z.object({
	accountId: z.uuid(),
	incomeId: z.uuid(),
});

/**
 * Stops a recurring income so today's occurrence is its last, and returns
 * the updated row. Requires an owner, admin, or member role on the account.
 */
export const stopRecurringIncomeFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(stopRecurringIncomeInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const income = await stopRecurringIncome(data);
		// null means it doesn't exist here, isn't recurring, or already ended.
		if (!income) throw new Error("No active recurring income to stop");
		return income;
	});
