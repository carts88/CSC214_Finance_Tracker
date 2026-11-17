import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { removeUserAsset } from "#/database/assets/queries.assets";
import { authMiddleware } from "#/lib/auth-middleware";

const removeAssetInput = z.object({
	accountId: z.uuid(),
	assetId: z.uuid(),
});

/**
 * Deletes an asset from a finance account and returns the deleted row.
 * Requires an owner, admin, or member role on the account.
 */
export const removeAssetFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(removeAssetInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const asset = await removeUserAsset(data);
		if (!asset) throw new Error("Asset not found");
		return asset;
	});
