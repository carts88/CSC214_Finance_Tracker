import { useSession } from "@better-auth-ui/react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { getMyAccountsFn } from "#/database/accounts/server-fn/get-my-accounts";
import { authClient } from "#/lib/auth-client";

export const accountKeys = {
	all: ["accounts"] as const,
	mine: (userId: string) => ["accounts", userId] as const,
};

/**
 * The signed-in user's finance accounts (their personal account is created
 * on first load). Waits until there's a session, since the server function
 * needs the user's auth token.
 */
export function useMyAccounts() {
	const { data: session } = useSession(authClient);
	const userId = session?.user.id;

	return useQuery({
		queryKey: accountKeys.mine(userId ?? ""),
		queryFn: userId ? () => getMyAccountsFn() : skipToken,
		staleTime: 5 * 60 * 1000,
	});
}
