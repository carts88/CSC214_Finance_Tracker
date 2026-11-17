import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { upsertUserAsset } from "#/database/assets/queries.assets";
import { assetValuesSchema } from "#/database/assets/schemas.assets";
import { authMiddleware } from "#/lib/auth-middleware";

const addAssetInput = assetValuesSchema.extend({
	accountId: z.uuid(),
	/** Pass an existing asset's id to edit it instead of creating a new one. */
	assetId: z.uuid().optional(),
});

export type AddAssetInput = z.input<typeof addAssetInput>;

/**
 * Creates an asset on a finance account, or edits one when `assetId` is
 * given. Requires an owner, admin, or member role on the account.
 */
export const addAssetFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(addAssetInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const asset = await upsertUserAsset(data);
		// null means `assetId` exists but belongs to a different account.
		if (!asset) throw new Error("Asset not found");
		return asset;
	});
