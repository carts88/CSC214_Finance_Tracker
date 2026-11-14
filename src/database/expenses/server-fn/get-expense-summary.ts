import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccountAccess } from "#/database/accounts/queries.account-access";
import { getExpenseOccurrences } from "#/database/expenses/queries.expenses";
import { authMiddleware } from "#/lib/auth-middleware";

const getExpenseSummaryInput = z
	.object({
		accountId: z.uuid(),
		/** First day of the range, 'YYYY-MM-DD'. */
		from: z.iso.date(),
		/** Last day of the range (inclusive), 'YYYY-MM-DD'. */
		to: z.iso.date(),
	})
	.refine((input) => input.from <= input.to, {
		message: "`from` must be on or before `to`",
	});

/**
 * Totals an account's expenses between `from` and `to`, counting each
 * occurrence of a recurring expense in that range. The client passes the
 * range so "this month" follows the viewer's own calendar.
 * Any active member of the account (including viewers) can read.
 */
export const getExpenseSummaryFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(getExpenseSummaryInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
		});
		const occurrences = await getExpenseOccurrences(data);
		return {
			total: occurrences.reduce((sum, o) => sum + o.amount, 0),
			count: occurrences.length,
		};
	});
