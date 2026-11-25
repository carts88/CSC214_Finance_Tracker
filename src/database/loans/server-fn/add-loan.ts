import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import {
	type AutopayChange,
	getUserLoan,
	saveUserLoan,
} from "#/database/loans/queries.loans";
import { loanValuesSchema } from "#/database/loans/schemas.loans";
import { authMiddleware } from "#/lib/auth-middleware";

const addLoanInput = loanValuesSchema.extend({
	accountId: z.uuid(),
	/** Pass an existing loan's id to edit it instead of creating a new one. */
	loanId: z.uuid().optional(),
});

/**
 * Creates a loan on a finance account, or edits one when `loanId` is given,
 * and keeps its autopay (monthly repeating expense) in step:
 * - autopay on, and the payment amount or next date changed (or there was
 *   no running autopay): the old series ends the day before the new date
 *   and a new one starts on it, so past payments keep their amount;
 * - autopay on and nothing about it changed: left alone;
 * - autopay off: a running series stops after today.
 *
 * Requires an owner, admin, or member role on the account.
 */
export const addLoanFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(addLoanInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});

		const existing = data.loanId
			? await getUserLoan({ accountId: data.accountId, loanId: data.loanId })
			: null;
		// `loanId` exists but belongs to a different account.
		if (data.loanId && !existing) throw new Error("Loan not found");

		const running = existing?.autopay_next_on ?? null;
		let autopay: AutopayChange = { kind: "keep" };
		if (data.autopay && data.autopayStartsOn) {
			const unchanged =
				running === data.autopayStartsOn &&
				existing?.payment_amount === data.paymentAmount;
			if (!unchanged) {
				autopay = { kind: "start", startsOn: data.autopayStartsOn };
			}
		} else if (!data.autopay && running) {
			autopay = { kind: "stop" };
		}

		const loan = await saveUserLoan({
			...data,
			loanId: data.loanId ?? crypto.randomUUID(),
			autopay,
		});
		if (!loan) throw new Error("Loan not found");
		return loan;
	});
