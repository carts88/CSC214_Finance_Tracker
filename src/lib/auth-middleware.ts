import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getAuthToken } from "#/lib/auth-client";
import { getUserFromRequest } from "#/lib/auth-server";

/**
 * Server-function middleware that requires a signed-in Neon Auth user.
 *
 * - Client side: attaches the user's Neon Auth JWT as `Authorization: Bearer`.
 * - Server side: verifies that JWT and exposes the user as `context.user`.
 *   Throws if the caller isn't signed in.
 *
 * Usage: `createServerFn().middleware([authMiddleware]).handler(({ context }) => context.user.sub)`
 */
export const authMiddleware = createMiddleware({ type: "function" })
	.client(async ({ next }) => {
		// The session cookie lives on the Neon Auth domain, so there's no token
		// to send when this runs during SSR; the server step will reject it.
		if (typeof window === "undefined") return next();
		try {
			const token = await getAuthToken();
			return next({ headers: { Authorization: `Bearer ${token}` } });
		} catch {
			return next();
		}
	})
	.server(async ({ next }) => {
		const user = await getUserFromRequest(getRequest());
		if (!user) throw new Error("Unauthorized");
		return next({ context: { user } });
	});
