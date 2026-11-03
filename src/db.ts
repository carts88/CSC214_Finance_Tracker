import { neon } from "@neondatabase/serverless";

// Server-only. Uses the pooled DATABASE_URL over Neon's HTTP transport, which
// suits per-request queries from TanStack Start server routes/functions.
// For multi-statement transactions use `sql.transaction([...])`.
let client: ReturnType<typeof neon> | undefined;

export function getSql() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL is not set. Run `neon env pull`.");
	}
	client ??= neon(url);
	return client;
}
