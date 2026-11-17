import type { AssetRow } from "#/database/assets/queries.assets";
import { ASSET_CATEGORIES } from "#/database/assets/schemas.assets";

/** The preset categories, plus the asset's own one if it isn't a preset. */
export function categoryOptions(current?: string) {
	const categories: string[] = [...ASSET_CATEGORIES];
	if (current && !categories.includes(current)) categories.push(current);
	return categories.map((category) => ({ value: category, label: category }));
}

/** The values that re-save `asset` exactly as it was (used by Undo). */
export function assetRestoreValues(asset: AssetRow) {
	return {
		assetId: asset.id,
		name: asset.name,
		category: asset.category,
		description: asset.description,
		value: asset.value,
		acquiredOn: asset.acquired_on,
	};
}
