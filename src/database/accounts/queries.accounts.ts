import type { MembershipRole } from "#/database/accounts/roles";
import { getSql } from "#/db";

/** A finance account the user belongs to, with their role on it. */
export interface UserAccountRow {
	id: string;
	name: string;
	type: "personal" | "business";
	base_currency: string;
	role: MembershipRole;
}

/**
 * Makes sure the user owns a personal finance account, creating one named
 * "Personal" if they don't. Safe to call on every visit: a per-user advisory
 * lock stops two simultaneous first visits from creating two accounts.
 *
 * @param userId the Neon Auth user id
 */
export const ensurePersonalAccount = async ({
	userId,
}: {
	userId: string;
}): Promise<void> => {
	const sql = getSql();
	await sql.transaction([
		sql`SELECT pg_advisory_xact_lock(hashtext(${`personal-account:${userId}`}))`,
		sql`
			WITH existing AS (
				SELECT fa.id
				FROM finance_accounts fa
				JOIN account_members am ON am.account_id = fa.id
				WHERE am.user_id = ${userId}::uuid
					AND am.role = 'owner'
					AND fa.type = 'personal'
				LIMIT 1
			)
			, new_account AS (
				INSERT INTO finance_accounts (name, type)
				SELECT 'Personal', 'personal'
				WHERE NOT EXISTS (SELECT 1 FROM existing)
				RETURNING id
			)
			INSERT INTO account_members (user_id, account_id, role, status)
			SELECT ${userId}::uuid, na.id, 'owner', 'active'
			FROM new_account na
		`,
	]);
};

/**
 * Lists the finance accounts the user is an active member of, personal
 * accounts first.
 *
 * @param userId the Neon Auth user id
 */
export const getUserAccounts = async ({
	userId,
}: {
	userId: string;
}): Promise<UserAccountRow[]> => {
	const sql = getSql();
	return (await sql`
		SELECT
			fa.id
			, fa.name
			, fa.type
			, fa.base_currency
			, am.role
		FROM account_members am
		JOIN finance_accounts fa ON fa.id = am.account_id
		WHERE am.user_id = ${userId}::uuid
			AND am.status = 'active'
		ORDER BY (fa.type = 'personal') DESC, fa.created_at
	`) as UserAccountRow[];
};
