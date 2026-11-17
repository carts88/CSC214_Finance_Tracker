import { z } from "zod";

/**
 * The editable fields of an asset. Shared by the asset form (client-side
 * validation) and `addAssetFn` (server-side validation) so the two can't
 * drift apart.
 */
export const assetValuesSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Enter a name")
		.max(100, "Keep the name under 100 characters"),
	category: z
		.string()
		.trim()
		.min(1, "Pick a category")
		.max(100, "Keep the category under 100 characters"),
	description: z
		.string()
		.trim()
		.max(500, "Keep the description under 500 characters")
		.nullish()
		.transform((value) => value || null),
	/** Current value in whole cents, e.g. $12.50 -> 1250. */
	value: z
		.number()
		.int()
		.positive("Enter a value greater than $0")
		.max(Number.MAX_SAFE_INTEGER),
	/** Date the asset was bought or received, as 'YYYY-MM-DD'. */
	acquiredOn: z.iso.date("Pick a date"),
});

export type AssetValues = z.input<typeof assetValuesSchema>;

/**
 * Selling an asset: what it sold for and when. The sale is recorded as a
 * one-off income and the asset is removed.
 */
export const sellAssetValuesSchema = z.object({
	/** Sale price in whole cents. */
	price: z
		.number()
		.int()
		.positive("Enter a sale price greater than $0")
		.max(Number.MAX_SAFE_INTEGER),
	/** Date of the sale as 'YYYY-MM-DD'. */
	soldOn: z.iso.date("Pick a date"),
});

export type SellAssetValues = z.input<typeof sellAssetValuesSchema>;

/** Suggested categories for the asset form's dropdown. */
export const ASSET_CATEGORIES = [
	"Real Estate",
	"Vehicle",
	"Investment",
	"Retirement",
	"Electronics",
	"Jewelry",
	"Collectible",
	"Equipment",
	"Other",
] as const;
