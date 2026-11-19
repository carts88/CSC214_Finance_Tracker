import { createServerFn } from "@tanstack/react-start";
import { getUserPreferences } from "#/database/preferences/queries.preferences";
import { authMiddleware } from "#/lib/auth-middleware";

/** Returns the signed-in user's preferences (defaults if never saved). */
export const getMyPreferencesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) =>
		getUserPreferences({ userId: context.user.sub }),
	);
