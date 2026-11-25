import { Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import type { LoanRow } from "#/database/loans/queries.loans";
import { useStopRecurringExpense } from "#/hooks/expenses/use-expenses";
import { useMoney } from "#/hooks/use-money";
import { formatDate, formatMonthYear } from "#/lib/utils/formatters/dates";
import { LoanHistory } from "./loan-history";
import { LoanPaymentForm } from "./loan-payment-form";
import { isPaidOff, paidOffShare } from "./utils/loan.utils";

interface ILoanPaymentsSheet {
	account: UserAccountRow;
	/** The loan whose payments are shown; undefined keeps the sheet closed. */
	loan?: LoanRow;
	/** Shows the payment form and delete buttons when true. */
	canEdit: boolean;
	onClose: () => void;
}

/**
 * One loan's balance, a form to record a payment against it, and a
 * timeline of its payments.
 */
export function LoanPaymentsSheet({
	account,
	loan,
	canEdit,
	onClose,
}: ILoanPaymentsSheet) {
	const { format } = useMoney(account.base_currency);

	return (
		<Sheet
			open={loan !== undefined}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<SheetContent className="overflow-y-auto sm:max-w-xl">
				{loan && (
					<>
						<SheetHeader>
							<SheetTitle>{loan.name}</SheetTitle>
							<SheetDescription>
								Taken out {formatMonthYear(loan.started_on)} ·{" "}
								{format(loan.principal_amount)} borrowed
							</SheetDescription>
						</SheetHeader>

						<div className="flex flex-col gap-6 px-4 pb-4">
							<BalanceProgress loan={loan} format={format} />

							<AutopayStatus account={account} loan={loan} canEdit={canEdit} />

							{canEdit &&
								(isPaidOff(loan) ? (
									<p className="rounded-lg border bg-muted/40 p-3 text-sm">
										This loan is paid off.
									</p>
								) : (
									<section className="flex flex-col gap-3">
										<h3 className="font-medium">Record a payment</h3>
										<LoanPaymentForm
											// New key per loan so the defaults reload.
											key={loan.id}
											accountId={account.id}
											currency={account.base_currency}
											loan={loan}
											onRecorded={(payment) =>
												toast.success(
													payment.amount >= loan.outstanding_balance
														? `${loan.name} is paid off!`
														: `${format(payment.amount)} payment recorded`,
												)
											}
										/>
									</section>
								))}

							<Separator />

							<LoanHistory account={account} loan={loan} canEdit={canEdit} />
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

/** Current balance with a bar showing how much of the loan is paid back. */
function BalanceProgress({
	loan,
	format,
}: {
	loan: LoanRow;
	format: (cents: number) => string;
}) {
	const share = paidOffShare(loan);
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-baseline justify-between gap-2">
				<span className="text-sm text-muted-foreground">Balance</span>
				<span className="text-2xl font-bold tabular-nums">
					{format(loan.outstanding_balance)}
				</span>
			</div>
			<div
				className="h-2 overflow-hidden rounded-full bg-muted"
				role="progressbar"
				aria-label="Paid back"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(share * 100)}
			>
				<div
					className="h-full rounded-full bg-chart-1"
					style={{ width: `${share * 100}%` }}
				/>
			</div>
			<dl className="grid grid-cols-3 gap-2 text-xs tabular-nums">
				<div>
					<dt className="text-muted-foreground">Borrowed</dt>
					<dd>{format(loan.principal_amount)}</dd>
				</div>
				<div>
					<dt className="text-muted-foreground">+ Interest so far</dt>
					<dd>{format(loan.interest_charged)}</dd>
				</div>
				<div>
					<dt className="text-muted-foreground">− Paid so far</dt>
					<dd>{format(loan.total_paid)}</dd>
				</div>
			</dl>
			<p className="text-xs text-muted-foreground">
				{Math.round(share * 100)}% of the amount borrowed paid back. Worked out
				from {formatDate(loan.started_on)} with interest added monthly.
			</p>
		</div>
	);
}

/**
 * Whether autopay is on and when it next pays. If the loan is paid off but
 * autopay is still running, offers to stop it so it stops adding expenses.
 */
function AutopayStatus({
	account,
	loan,
	canEdit,
}: {
	account: UserAccountRow;
	loan: LoanRow;
	canEdit: boolean;
}) {
	const stopRecurring = useStopRecurringExpense(account.id);
	const { format } = useMoney(account.base_currency);

	if (!loan.autopay_next_on || !loan.autopay_expense_id) {
		return (
			<p className="text-sm text-muted-foreground">
				Autopay is off. Turn it on by editing the loan.
			</p>
		);
	}

	const paidOff = isPaidOff(loan);
	const expenseId = loan.autopay_expense_id;
	function stop() {
		stopRecurring.mutate(expenseId, {
			onSuccess: () => toast.success(`Stopped autopay on ${loan.name}`),
			onError: (error) =>
				toast.error("Couldn't stop autopay", { description: error.message }),
		});
	}

	return (
		<div
			className={
				paidOff
					? "flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
					: "flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm"
			}
		>
			<span className="flex items-center gap-2">
				<Repeat className="size-4 text-muted-foreground" aria-hidden />
				Autopay: {format(loan.payment_amount)} monthly, next on{" "}
				{formatDate(loan.autopay_next_on)}.
			</span>
			{paidOff && (
				<>
					<span>
						This loan is paid off, but autopay will keep adding this payment as
						an expense until you stop it.
					</span>
					{canEdit && (
						<Button
							variant="destructive"
							size="sm"
							className="self-start"
							disabled={stopRecurring.isPending}
							onClick={stop}
						>
							Stop autopay
						</Button>
					)}
				</>
			)}
		</div>
	);
}
