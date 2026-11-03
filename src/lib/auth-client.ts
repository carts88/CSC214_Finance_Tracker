import { createAuthClient } from "@neon/auth";
import { BetterAuthReactAdapter } from "@neon/auth/react/adapters";

// Neon Auth (Managed Better Auth). The browser talks directly to the branch's
// Auth URL; `credentials: 'include'` sends the session cookie cross-origin so
// `authClient.token()` can mint a JWT for our own server routes.
export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, {
	adapter: BetterAuthReactAdapter({
		fetchOptions: { credentials: "include" },
	}),
});

// Returns a short-lived EdDSA JWT for our API routes.
//
// Don't call Better Auth's `token()` here: @neon/auth intercepts `/token`
// requests and answers them with the cached `{ session, user }` object, so the
// result never has a top-level `token`. Instead, Neon Auth puts the JWT (from
// the `set-auth-jwt` response header) into `session.token` — this mirrors the
// library's own `getJWTToken()`.
export async function getAuthToken(): Promise<string> {
	const { data, error } = await authClient.getSession();
	const token = data?.session?.token;
	if (error || !token) throw new Error("Could not get auth token");
	return token;
}
