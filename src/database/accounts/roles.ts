// Kept free of database imports so client components can use these too.

export type MembershipRole = "owner" | "admin" | "member" | "viewer";

/** Roles allowed to create, edit, or delete an account's records. */
export const WRITE_ROLES: readonly MembershipRole[] = [
	"owner",
	"admin",
	"member",
];

export function canWrite(role: MembershipRole): boolean {
	return WRITE_ROLES.includes(role);
}
