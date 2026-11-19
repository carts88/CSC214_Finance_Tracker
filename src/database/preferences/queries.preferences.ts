import { getSql } from "#/db";
import {
	type CurrencyCode,
	DEFAULT_CURRENCY,
	isSupportedCurrency,
} from "#/lib/currency";

/** The settings a user has saved. Only the fields the app uses so far. */
export interface UserPreferences {
	/** The currency the user views amounts in. */
	currency: CurrencyCode;
}

/**
 * The user's saved preferences, or the defaults if they've never saved any
 * (rows are only created on the first save).
 *
 * @param userId the Neon Auth user id
 */
export const getUserPreferences = async ({
	userId,
}: {
	userId: string;
}): Promise<UserPreferences> => {
	const sql = getSql();
	const rows = (await sql`
		SELECT up.currency
		FROM user_preferences up
		WHERE up.user_id = ${userId}::uuid
	`) as { currency: string }[];
	const saved = rows[0]?.currency;
	return {
		currency: saved && isSupportedCurrency(saved) ? saved : DEFAULT_CURRENCY,
	};
};

/**
 * Saves the user's display currency, creating their preferences row if
 * needed.
 *
 * @param userId the Neon Auth user id
 */
export const setUserCurrency = async ({
	userId,
	currency,
}: {
	userId: string;
	currency: CurrencyCode;
}): Promise<UserPreferences> => {
	const sql = getSql();
	await sql`
		INSERT INTO user_preferences (user_id, currency)
		VALUES (${userId}::uuid, ${currency})
		ON CONFLICT (user_id) DO UPDATE SET currency = EXCLUDED.currency
	`;
	return { currency };
};
