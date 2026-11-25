import { createContext, type ReactNode, useContext, useState } from "react";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { useMyAccounts } from "#/hooks/accounts/use-my-accounts";

interface IActiveAccountContext {
	/** The signed-in user's accounts query. */
	accounts: ReturnType<typeof useMyAccounts>;
	/** The account picked in the account picker (the first one by default). */
	account: UserAccountRow | undefined;
	setAccountId: (id: string) => void;
}

const ActiveAccountContext = createContext<IActiveAccountContext | null>(null);

/**
 * Holds the account the user is working in, so every page and the top
 * toolbar's "Add" buttons agree on it (and it stays picked across pages).
 */
export function ActiveAccountProvider({ children }: { children: ReactNode }) {
	const accounts = useMyAccounts();
	const [selectedId, setAccountId] = useState<string>();
	const account =
		accounts.data?.find((a) => a.id === selectedId) ?? accounts.data?.[0];

	return (
		<ActiveAccountContext.Provider value={{ accounts, account, setAccountId }}>
			{children}
		</ActiveAccountContext.Provider>
	);
}

export function useActiveAccount() {
	const ctx = useContext(ActiveAccountContext);
	if (!ctx) {
		throw new Error(
			"useActiveAccount must be used inside ActiveAccountProvider",
		);
	}
	return ctx;
}
