import type { MembershipRole } from "#/database/accounts/roles";
import { getSql } from "#/db";

export { type MembershipRole, WRITE_ROLES } from "#/database/accounts/roles";

/**
 * Looks up the user's active role on a finance account.
 *
 * @returns the role, or null if the user isn't an active member of the account
 */
export const getAccountRole = async ({
	user_id: userId,
	account_id: accountId,
}: {
	user_id: string;
	account_id: string;
}): Promise<MembershipRole | null> => {
	const sql = getSql();
	const rows = (await sql`
		SELECT am.role
		FROM account_members am
		WHERE am.user_id = ${userId}
			AND am.account_id = ${accountId}
			AND am.status = 'active'
	`) as { role: MembershipRole }[];
	return rows[0]?.role ?? null;
};

/**
 * Throws unless the user is an active member of the account and, when `roles`
 * is given, holds one of those roles. Call this at the top of every server
 * function that takes an `account_id` from the client.
 */
export const assertAccountAccess = async ({
	user_id: userId,
	account_id: accountId,
	roles,
}: {
	user_id: string;
	account_id: string;
	roles?: readonly MembershipRole[];
}): Promise<MembershipRole> => {
	const role = await getAccountRole({
		user_id: userId,
		account_id: accountId,
	});
	// Same message for "not a member" and "wrong role" so callers can't probe
	// which account ids exist.
	if (!role || (roles && !roles.includes(role))) {
		throw new Error("You don't have access to this account");
	}
	return role;
};
