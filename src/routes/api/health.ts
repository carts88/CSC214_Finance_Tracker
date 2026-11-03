import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "#/db";

// Public: proves the app can reach Neon Postgres.
export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				const sql = getSql();
				const rows = (await sql`
					SELECT now() AS now, current_database() AS database, version() AS version
				`) as { now: string; database: string; version: string }[];
				return Response.json({ ok: true, postgres: rows[0] });
			},
		},
	},
});
