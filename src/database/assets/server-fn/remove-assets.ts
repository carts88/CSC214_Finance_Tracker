import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { removeUserAssets } from "#/database/assets/queries.assets";
import { authMiddleware } from "#/lib/auth-middleware";

const removeAssetsInput = z.object({
	accountId: z.uuid(),
	assetIds: z.array(z.uuid()).min(1),
});

/**
 * Deletes several assets from a finance account and returns the deleted
 * rows. Requires an owner, admin, or member role on the account.
 */
export const removeAssetsFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(removeAssetsInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		return removeUserAssets(data);
	});
