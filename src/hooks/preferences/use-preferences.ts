import { useSession } from "@better-auth-ui/react";
import {
	skipToken,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { getMyPreferencesFn } from "#/database/preferences/server-fn/get-my-preferences";
import { setMyCurrencyFn } from "#/database/preferences/server-fn/set-my-currency";
import { authClient } from "#/lib/auth-client";
import type { CurrencyCode } from "#/lib/currency";

export const preferenceKeys = {
	mine: (userId: string) => ["preferences", userId] as const,
};

/**
 * The signed-in user's saved preferences. Waits until there's a session,
 * since the server function needs the user's auth token.
 */
export function usePreferences() {
	const { data: session } = useSession(authClient);
	const userId = session?.user.id;

	return useQuery({
		queryKey: preferenceKeys.mine(userId ?? ""),
		queryFn: userId ? () => getMyPreferencesFn() : skipToken,
		staleTime: 5 * 60 * 1000,
	});
}

/** Saves the user's display currency; every amount on the site follows it. */
export function useSetCurrency() {
	const { data: session } = useSession(authClient);
	const userId = session?.user.id ?? "";
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (currency: CurrencyCode) =>
			setMyCurrencyFn({ data: { currency } }),
		onSuccess: (prefs) =>
			queryClient.setQueryData(preferenceKeys.mine(userId), prefs),
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: preferenceKeys.mine(userId),
			}),
	});
}
