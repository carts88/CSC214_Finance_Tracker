import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";

// Server-only. Verifies a Neon Auth JWT (from `getAuthToken()`) sent as
// `Authorization: Bearer <token>` against the branch's JWKS.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
	const url = process.env.NEON_AUTH_JWKS_URL;
	if (!url) {
		throw new Error("NEON_AUTH_JWKS_URL is not set. Run `neon env pull`.");
	}
	jwks ??= createRemoteJWKSet(new URL(url));
	return jwks;
}

export type AuthenticatedUser = JWTPayload & { sub: string };

export async function getUserFromRequest(
	request: Request,
): Promise<AuthenticatedUser | null> {
	const header = request.headers.get("authorization") ?? "";
	const [scheme, token] = header.split(" ");
	if (scheme?.toLowerCase() !== "bearer" || !token) return null;

	// Neon Auth sets both `iss` and `aud` to the Auth host's origin.
	const baseUrl = process.env.NEON_AUTH_BASE_URL;
	const origin = baseUrl ? new URL(baseUrl).origin : undefined;
	try {
		const { payload } = await jwtVerify(token, getJwks(), {
			issuer: origin,
			audience: origin,
		});
		if (!payload.sub) return null;
		return payload as AuthenticatedUser;
	} catch {
		return null;
	}
}
