import { useSession } from "@better-auth-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AccountPicker } from "#/components/accounts/account-picker";
import { useActiveAccount } from "#/components/accounts/active-account-context";
import { AssetsCardSkeleton } from "#/components/asset-management/assets-card/assets-card-skeleton";
import { ErrorAlert } from "#/components/common/error-alert";
import { LoanSummaryStrip } from "#/components/loan-management/loan-summary-strip";
import { LoansCard } from "#/components/loan-management/loans-card";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/loan-management/")({
	component: LoanManagementPage,
});

function LoanManagementPage() {
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

	// Adding a loan happens from the global "Add loan" toolbar button.
	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Loan Management</h1>
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
				// Remount per account so open sheets reset on switch.
				<div key={account.id} className="flex flex-col gap-6">
					<LoanSummaryStrip account={account} />
					<LoansCard account={account} />
				</div>
			) : (
				<AssetsCardSkeleton />
			)}
		</div>
	);
}
