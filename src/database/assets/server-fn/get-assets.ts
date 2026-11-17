import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAccountAccess } from "#/database/accounts/queries.account-access";
import { getUserAssets } from "#/database/assets/queries.assets";
import { authMiddleware } from "#/lib/auth-middleware";

const getAssetsInput = z.object({
	accountId: z.uuid(),
});

/**
 * Returns every asset on a finance account, most valuable first.
 * Any active member of the account (including viewers) can read.
 */
export const getAssetsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(getAssetsInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
		});
		return getUserAssets({ accountId: data.accountId });
	});
