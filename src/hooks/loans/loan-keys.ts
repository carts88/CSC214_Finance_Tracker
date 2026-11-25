/**
 * TanStack Query keys for loans. In their own file so the expense hooks can
 * refresh loans (an expense can be a loan payment) without importing
 * use-loans.ts, which imports the expense hooks.
 */
export const loanKeys = {
	/** Everything loan-related on an account: the list and every payment history. */
	all: (accountId: string) => ["loans", accountId] as const,
	list: (accountId: string) => ["loans", accountId, "list"] as const,
	payments: (accountId: string, loanId: string) =>
		["loans", accountId, "payments", loanId] as const,
};
