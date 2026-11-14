import { createServerFn } from "@tanstack/react-start";
import {
	ensurePersonalAccount,
	getUserAccounts,
} from "#/database/accounts/queries.accounts";
import { authMiddleware } from "#/lib/auth-middleware";

/**
 * Returns the signed-in user's finance accounts. On a user's first call this
 * also creates their personal account, so there is always at least one.
 */
export const getMyAccountsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const userId = context.user.sub;
		await ensurePersonalAccount({ userId });
		return getUserAccounts({ userId });
	});
