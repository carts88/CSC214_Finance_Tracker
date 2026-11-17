import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assertAccountAccess,
	WRITE_ROLES,
} from "#/database/accounts/queries.account-access";
import { sellUserAsset } from "#/database/assets/queries.assets";
import { sellAssetValuesSchema } from "#/database/assets/schemas.assets";
import { authMiddleware } from "#/lib/auth-middleware";

const sellAssetInput = sellAssetValuesSchema.extend({
	accountId: z.uuid(),
	assetId: z.uuid(),
});

/**
 * Sells an asset: records the sale price as a one-off income and removes the
 * asset. Returns both rows. Requires an owner, admin, or member role.
 */
export const sellAssetFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(sellAssetInput)
	.handler(async ({ data, context }) => {
		await assertAccountAccess({
			userId: context.user.sub,
			accountId: data.accountId,
			roles: WRITE_ROLES,
		});
		const sold = await sellUserAsset(data);
		if (!sold) throw new Error("Asset not found");
		return sold;
	});
