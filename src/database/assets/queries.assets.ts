import {
	INCOME_COLUMNS,
	type IncomeRow,
} from "#/database/incomes/queries.incomes";
import { getSql } from "#/db";

/**
 * Row shape returned by the asset queries.
 * - `value` is whole cents (BIGINT), cast to float8 so it arrives as a JS
 *   number (see IncomeRow).
 * - `acquired_on` is 'YYYY-MM-DD' text so it isn't shifted by the server's
 *   timezone when parsed into a JS Date.
 * - category/description/acquired_on come from db/003_assets.sql.
 */
export interface AssetRow {
	id: string;
	name: string;
	category: string;
	description: string | null;
	value: number;
	/** Date the asset was bought or received. */
	acquired_on: string;
	created_at: string;
}

/**
 * The SELECT/RETURNING list that produces an `AssetRow`. Columns are
 * unqualified so it works in both `SELECT ... FROM assets` and `RETURNING`.
 */
export const ASSET_COLUMNS = `
	id
	, name
	, category
	, description
	, value::float8 AS value
	, acquired_on::text AS acquired_on
	, created_at
`;

interface IAssetAccount {
	accountId: string;
}

interface IAssetValues {
	name: string;
	category: string;
	description?: string | null;
	/** Whole cents. Must be > 0. */
	value: number;
	/** 'YYYY-MM-DD'. */
	acquiredOn: string;
}

/**
 * Retrieves all assets for a given finance account, most valuable first.
 * @param accountId the finance account these assets belong to
 * @returns the account's assets
 */
export const getUserAssets = async ({
	accountId,
}: IAssetAccount): Promise<AssetRow[]> => {
	const sql = getSql();
	return (await sql`
		SELECT ${sql.unsafe(ASSET_COLUMNS)}
		FROM assets
		WHERE account_id = ${accountId}
		ORDER BY value DESC, name
	`) as AssetRow[];
};

/**
 * Creates an asset, or updates it when `assetId` is given and already
 * exists. An update only applies if the asset belongs to `accountId`, so one
 * account can't overwrite another account's asset.
 *
 * @returns the saved asset, or null if `assetId` belongs to another account
 */
export const upsertUserAsset = async ({
	accountId,
	assetId,
	name,
	category,
	description = null,
	value,
	acquiredOn,
}: IAssetAccount &
	IAssetValues & { assetId?: string }): Promise<AssetRow | null> => {
	const sql = getSql();
	const rows = (await sql`
		INSERT INTO assets (id, account_id, name, category, description, value, acquired_on)
		VALUES (
			COALESCE(${assetId ?? null}::uuid, gen_random_uuid())
			, ${accountId}
			, ${name}
			, ${category}
			, ${description}
			, ${value}
			, ${acquiredOn}::date
		)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name
			, category = EXCLUDED.category
			, description = EXCLUDED.description
			, value = EXCLUDED.value
			, acquired_on = EXCLUDED.acquired_on
		WHERE assets.account_id = EXCLUDED.account_id
		RETURNING ${sql.unsafe(ASSET_COLUMNS)}
	`) as AssetRow[];
	return rows[0] ?? null;
};

/**
 * Deletes an asset from a given finance account.
 *
 * @returns the deleted asset, or null if it didn't exist on this account
 */
export const removeUserAsset = async ({
	accountId,
	assetId,
}: IAssetAccount & { assetId: string }): Promise<AssetRow | null> => {
	const sql = getSql();
	const rows = (await sql`
		DELETE FROM assets
		WHERE account_id = ${accountId} AND id = ${assetId}
		RETURNING ${sql.unsafe(ASSET_COLUMNS)}
	`) as AssetRow[];
	return rows[0] ?? null;
};

/**
 * Deletes several assets from a given finance account in one statement.
 * Ids that don't exist on this account are skipped.
 *
 * @returns the deleted assets
 */
export const removeUserAssets = async ({
	accountId,
	assetIds,
}: IAssetAccount & { assetIds: string[] }): Promise<AssetRow[]> => {
	const sql = getSql();
	return (await sql`
		DELETE FROM assets
		WHERE account_id = ${accountId} AND id = ANY(${assetIds}::uuid[])
		RETURNING ${sql.unsafe(ASSET_COLUMNS)}
	`) as AssetRow[];
};

export interface SoldAsset {
	asset: AssetRow;
	/** The one-off income recording the sale. */
	income: IncomeRow;
}

/**
 * Sells an asset: records the sale as a one-off income ("Sale of <name>")
 * and deletes the asset, in one transaction.
 *
 * The income is inserted from a SELECT on the asset, so nothing is recorded
 * unless the asset exists on `accountId`.
 *
 * @param price sale price in whole cents
 * @param soldOn 'YYYY-MM-DD'
 * @returns the removed asset and the new income, or null if the asset isn't
 *   on this account
 */
export const sellUserAsset = async ({
	accountId,
	assetId,
	price,
	soldOn,
}: IAssetAccount & {
	assetId: string;
	price: number;
	soldOn: string;
}): Promise<SoldAsset | null> => {
	const sql = getSql();
	const [incomes, assets] = (await sql.transaction([
		sql`
			INSERT INTO incomes (account_id, amount, occurred_on, source, frequency)
			SELECT account_id, ${price}, ${soldOn}::date, left('Sale of ' || name, 100), 'never'
			FROM assets
			WHERE account_id = ${accountId} AND id = ${assetId}
			RETURNING ${sql.unsafe(INCOME_COLUMNS)}
		`,
		sql`
			DELETE FROM assets
			WHERE account_id = ${accountId} AND id = ${assetId}
			RETURNING ${sql.unsafe(ASSET_COLUMNS)}
		`,
	])) as [IncomeRow[], AssetRow[]];
	if (!assets[0] || !incomes[0]) return null;
	return { asset: assets[0], income: incomes[0] };
};
