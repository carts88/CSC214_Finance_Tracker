import { useSession } from "@better-auth-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AccountPicker } from "#/components/accounts/account-picker";
import { useActiveAccount } from "#/components/accounts/active-account-context";
import { ErrorAlert } from "#/components/common/error-alert";
import { Reports } from "#/components/reports/reports";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/reports/")({
	component: ReportsPage,
});

function ReportsPage() {
	const navigate = useNavigate();
	const { data: session, isFetching } = useSession(authClient);
	const signedOut = !session && !isFetching;

	useEffect(() => {
		if (signedOut) {
			void navigate({ to: "/auth/$path", params: { path: "sign-in" } });
		}
	}, [signedOut, navigate]);

	const { accounts, account, setAccountId } = useActiveAccount();

	if (!session) return null;

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Reports</h1>
				{accounts.data && accounts.data.length > 1 && account && (
					<AccountPicker
						accounts={accounts.data}
						value={account.id}
						onChange={setAccountId}
					/>
				)}
			</div>

			{accounts.isError ? (
				<ErrorAlert
					title="Couldn't load your accounts"
					error={accounts.error}
				/>
			) : account ? (
				// Remount per account so the filters reset on switch.
				<Reports key={account.id} account={account} />
			) : null}
		</div>
	);
}
