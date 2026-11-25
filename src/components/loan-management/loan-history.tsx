import { format, parse } from "date-fns";
import { Banknote, Percent, Repeat, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { ErrorAlert } from "#/components/common/error-alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import type { LoanPaymentRow, LoanRow } from "#/database/loans/queries.loans";
import { frequencyLabel } from "#/database/schemas.recurrence";
import {
	useRemoveExpense,
	useSaveExpense,
} from "#/hooks/expenses/use-expenses";
import { useLoanPayments } from "#/hooks/loans/use-loans";
import { useMoney } from "#/hooks/use-money";
import { formatDate } from "#/lib/utils/formatters/dates";
import { type LoanEvent, loanBalance } from "#/lib/utils/helpers/loan-payoff";
import { today } from "#/lib/utils/helpers/recurrence";

type PaymentInput = LoanPaymentRow & { paidOn: string };
type HistoryEvent = LoanEvent<PaymentInput>;

interface ILoanHistory {
	account: UserAccountRow;
	loan: LoanRow;
	/** Shows delete buttons on one-off payments when true. */
	canEdit: boolean;
}

/**
 * Every payment on the loan as a timeline grouped by month, newest first,
 * each with the balance it left. Interest charges can be shown too, like a
 * statement.
 */
export function LoanHistory({ account, loan, canEdit }: ILoanHistory) {
	const payments = useLoanPayments(account.id, loan.id);
	const [showInterest, setShowInterest] = useState(false);
	const switchId = useId();

	if (payments.isPending) {
		return <Skeleton className="h-24 w-full" />;
	}
	if (payments.isError) {
		return (
			<ErrorAlert title="Couldn't load the payments" error={payments.error} />
		);
	}

	// Worked out here from the same payments, so each one can show the
	// balance it left. Matches the loan's own balance from the server.
	const { events } = loanBalance({
		principal: loan.principal_amount,
		annualInterestRate: loan.annual_interest_rate,
		startedOn: loan.started_on,
		payments: payments.data.map((p) => ({ ...p, paidOn: p.paid_on })),
		asOf: today(),
	});
	const shown = events
		.filter((event) => showInterest || event.kind === "payment")
		.reverse();

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2">
				<h3 className="font-medium">Payment history</h3>
				<div className="flex items-center gap-2">
					<Switch
						id={switchId}
						size="sm"
						checked={showInterest}
						onCheckedChange={setShowInterest}
					/>
					<Label htmlFor={switchId} className="text-xs font-normal">
						Show interest
					</Label>
				</div>
			</div>

			{shown.length === 0 ? (
				<p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
					No payments recorded yet.
				</p>
			) : (
				<Timeline
					account={account}
					loan={loan}
					events={shown}
					canEdit={canEdit}
				/>
			)}
		</section>
	);
}

/** Events grouped under a heading per month, with a line joining them. */
function Timeline({
	account,
	loan,
	events,
	canEdit,
}: {
	account: UserAccountRow;
	loan: LoanRow;
	/** Newest first. */
	events: HistoryEvent[];
	canEdit: boolean;
}) {
	const { format: money } = useMoney(account.base_currency);
	// A one-off payment is an expense: delete it as one, and undo by saving
	// it again with the same id.
	const removePayment = useRemoveExpense(account.id);
	const savePayment = useSaveExpense(account.id);

	function handleDelete(payment: LoanPaymentRow) {
		removePayment.mutate(payment.expense_id, {
			onSuccess: () =>
				toast.success(`Deleted ${money(payment.amount)} payment`, {
					action: {
						label: "Undo",
						onClick: () =>
							savePayment.mutate(
								{
									expenseId: payment.expense_id,
									amount: payment.amount,
									occurredOn: payment.paid_on,
									category: loan.name,
									description: payment.note,
									frequency: "never",
									loanId: loan.id,
								},
								{
									onError: () => toast.error("Couldn't restore the payment"),
								},
							),
					},
				}),
			onError: (error) =>
				toast.error("Couldn't delete the payment", {
					description: error.message,
				}),
		});
	}

	return (
		<div className="flex flex-col gap-5">
			{groupByMonth(events).map(({ month, events: monthEvents }) => {
				const paid = monthEvents.reduce(
					(sum, e) => (e.kind === "payment" ? sum + e.amount : sum),
					0,
				);
				return (
					<section key={month} className="flex flex-col gap-2">
						<header className="flex items-baseline justify-between text-xs text-muted-foreground">
							<span className="font-medium uppercase tracking-wide">
								{format(parse(month, "yyyy-MM", new Date()), "MMMM yyyy")}
							</span>
							{paid > 0 && (
								<span className="tabular-nums">{money(paid)} paid</span>
							)}
						</header>
						<ol className="ml-3 flex flex-col border-l">
							{monthEvents.map((event) => (
								<TimelineItem
									key={
										event.kind === "payment"
											? `${event.payment.expense_id}:${event.on}`
											: `interest:${event.on}`
									}
									event={event}
									money={money}
									onDelete={
										canEdit &&
										event.kind === "payment" &&
										event.payment.frequency === "never"
											? () => handleDelete(event.payment)
											: undefined
									}
									deleting={removePayment.isPending}
									reserveDeleteSpace={canEdit}
								/>
							))}
						</ol>
					</section>
				);
			})}
		</div>
	);
}

/** One payment or interest charge, with the balance it left. */
function TimelineItem({
	event,
	money,
	onDelete,
	deleting,
	reserveDeleteSpace,
}: {
	event: HistoryEvent;
	money: (cents: number) => string;
	/** Set for one-off payments the user can delete. */
	onDelete?: () => void;
	deleting: boolean;
	/** Keeps amounts lined up when other rows have a delete button. */
	reserveDeleteSpace: boolean;
}) {
	const isPayment = event.kind === "payment";
	const repeating = isPayment && event.payment.frequency !== "never";
	const Icon = !isPayment ? Percent : repeating ? Repeat : Banknote;

	return (
		<li className="group relative flex items-start gap-3 py-2 pl-6">
			<span
				className={
					isPayment
						? "absolute -left-3 top-2 flex size-6 items-center justify-center rounded-full border bg-primary text-primary-foreground"
						: "absolute -left-3 top-2 flex size-6 items-center justify-center rounded-full border bg-muted text-muted-foreground"
				}
				aria-hidden
			>
				<Icon className="size-3.5" />
			</span>

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className="flex items-center gap-1.5 text-sm">
					<span className="truncate font-medium">{itemTitle(event)}</span>
					{repeating && (
						<Badge
							variant="secondary"
							title="A repeating expense on this loan. Stop or edit it on the Finance Management page."
						>
							{frequencyLabel(event.payment.frequency)}
						</Badge>
					)}
				</div>
				<span className="text-xs text-muted-foreground">
					{formatDate(event.on)} · Balance after {money(event.balance)}
				</span>
			</div>

			<span
				className={
					isPayment
						? "text-sm font-semibold tabular-nums"
						: "text-sm tabular-nums text-muted-foreground"
				}
			>
				{isPayment ? "−" : "+"}
				{money(event.amount)}
			</span>

			{onDelete ? (
				<Button
					variant="ghost"
					size="icon-sm"
					className="-my-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
					aria-label={`Delete the ${formatDate(event.on)} payment`}
					disabled={deleting}
					onClick={onDelete}
				>
					<Trash2 />
				</Button>
			) : (
				reserveDeleteSpace && <span className="size-8 shrink-0" aria-hidden />
			)}
		</li>
	);
}

function itemTitle(event: HistoryEvent): string {
	if (event.kind === "interest") return "Interest added";
	if (event.payment.note) return event.payment.note;
	return event.payment.frequency === "never" ? "Payment" : "Autopay payment";
}

/** Splits newest-first events into runs by calendar month, keeping order. */
function groupByMonth(events: HistoryEvent[]) {
	const groups: { month: string; events: HistoryEvent[] }[] = [];
	for (const event of events) {
		const month = event.on.slice(0, 7);
		const last = groups.at(-1);
		if (last?.month === month) last.events.push(event);
		else groups.push({ month, events: [event] });
	}
	return groups;
}
