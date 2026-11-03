import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "#/db";
import { getUserFromRequest } from "#/lib/auth-server";

// Protected: verifies the Neon Auth JWT, then reads the caller's own row from
// the `neon_auth.user` table that Managed Better Auth keeps in Postgres.
export const Route = createFileRoute("/api/me")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const user = await getUserFromRequest(request);
				if (!user) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				const sql = getSql();
				const rows = (await sql`
					SELECT id, name, email, "emailVerified", "createdAt"
					FROM neon_auth."user"
					WHERE id = ${user.sub}
				`) as Record<string, unknown>[];
				return Response.json({
					tokenSubject: user.sub,
					dbUser: rows[0] ?? null,
				});
			},
		},
	},
});
