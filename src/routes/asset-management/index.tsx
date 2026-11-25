import { useSession } from "@better-auth-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountPicker } from "#/components/accounts/account-picker";
import { useActiveAccount } from "#/components/accounts/active-account-context";
import { AssetsCard } from "#/components/asset-management/assets-card/assets-card";
import { AssetsCardSkeleton } from "#/components/asset-management/assets-card/assets-card-skeleton";
import { DeleteSelectedAssetsButton } from "#/components/asset-management/delete-selected-assets-button";
import { ErrorAlert } from "#/components/common/error-alert";
import { HeaderActions } from "#/components/navigation/header-actions";
import { canWrite } from "#/database/accounts/roles";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/asset-management/")({
	component: AssetManagementPage,
});

function AssetManagementPage() {
	const navigate = useNavigate();
	const { data: session, isFetching } = useSession(authClient);
	const signedOut = !session && !isFetching;

	useEffect(() => {
		if (signedOut) {
			void navigate({ to: "/auth/$path", params: { path: "sign-in" } });
		}
	}, [signedOut, navigate]);

	const { accounts, account, setAccountId } = useActiveAccount();
	/** Rows checked in the table; deleted together from the toolbar. */
	const [selected, setSelected] = useState<Set<string>>(() => new Set());

	function switchAccount(id: string) {
		setAccountId(id);
		setSelected(new Set());
	}

	if (!session) return null;

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Asset Management</h1>
				{accounts.data && accounts.data.length > 1 && account && (
					<AccountPicker
						accounts={accounts.data}
						value={account.id}
						onChange={switchAccount}
					/>
				)}
			</div>

			{account && canWrite(account.role) && (
				<HeaderActions>
					<DeleteSelectedAssetsButton
						account={account}
						selected={selected}
						onDeleted={() => setSelected(new Set())}
					/>
				</HeaderActions>
			)}

			{accounts.isError ? (
				<ErrorAlert
					title="Couldn't load your accounts"
					error={accounts.error}
				/>
			) : account ? (
				// Remount per account so the table resets on switch.
				<div key={account.id} className="flex flex-col gap-6">
					<AssetsCard
						account={account}
						selected={selected}
						onSelectedChange={setSelected}
					/>
				</div>
			) : (
				<AssetsCardSkeleton />
			)}
		</div>
	);
}
