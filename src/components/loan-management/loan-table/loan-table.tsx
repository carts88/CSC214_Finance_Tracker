import { History, Pencil, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import type { LoanRow } from "#/database/loans/queries.loans";
import { useMoney } from "#/hooks/use-money";
import { formatDate, formatMonthYear } from "#/lib/utils/formatters/dates";
import {
	formatRate,
	isPaidOff,
	loanPayoff,
	loanTotals,
} from "../utils/loan.utils";

interface ILoanTable {
	loans: LoanRow[];
	/** The account's base currency (ISO 4217, e.g. "USD") the amounts are in. */
	currency: string;
	/** Hides the edit/delete buttons when false (viewers can still see payments). */
	canEdit: boolean;
	/** Opens the loan's payments: history, and a form to record one. */
	onPayments: (loan: LoanRow) => void;
	onEdit: (loan: LoanRow) => void;
	onDelete: (loan: LoanRow) => void;
}

export function LoanTable({
	loans,
	currency,
	canEdit,
	onPayments,
	onEdit,
	onDelete,
}: ILoanTable) {
	const { format } = useMoney(currency);
	const { totalOwed, totalMonthly } = loanTotals(loans);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead className="text-right">Balance</TableHead>
					<TableHead className="text-right">Rate</TableHead>
					<TableHead className="text-right">Monthly</TableHead>
					<TableHead>Payments</TableHead>
					<TableHead>Paid off by</TableHead>
					<TableHead className="w-32">
						<span className="sr-only">Actions</span>
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{loans.map((loan) => {
					const paidOff = isPaidOff(loan);
					const payoff = paidOff ? null : loanPayoff(loan);
					return (
						<TableRow key={loan.id}>
							<TableCell>
								<div className="font-medium">{loan.name}</div>
								<div className="text-xs text-muted-foreground">
									Since {formatMonthYear(loan.started_on)}
								</div>
							</TableCell>
							<TableCell className="text-right tabular-nums">
								<div>{format(loan.outstanding_balance)}</div>
								<div className="text-xs text-muted-foreground">
									of {format(loan.principal_amount)}
								</div>
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{formatRate(loan.annual_interest_rate)}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								<div>{format(loan.payment_amount)}</div>
								<div className="text-xs text-muted-foreground">
									{loan.autopay_next_on
										? `Autopay · next ${formatDate(loan.autopay_next_on)}`
										: "Manual"}
								</div>
							</TableCell>
							<TableCell className="whitespace-nowrap">
								{loan.payment_count === 0 ? (
									<span className="text-muted-foreground">None yet</span>
								) : (
									<>
										<div className="tabular-nums">
											{loan.payment_count} recorded
										</div>
										{loan.last_paid_on && (
											<div className="text-xs text-muted-foreground">
												Last {formatDate(loan.last_paid_on)}
											</div>
										)}
									</>
								)}
							</TableCell>
							<TableCell className="whitespace-nowrap">
								{paidOff ? (
									<span className="font-medium text-chart-1">Paid off</span>
								) : payoff ? (
									<>
										<div>{formatMonthYear(payoff.payoffDate)}</div>
										<div className="text-xs text-muted-foreground tabular-nums">
											{payoff.months} payments · {format(payoff.totalInterest)}{" "}
											interest
										</div>
									</>
								) : (
									<span
										className="text-destructive"
										title="The monthly payment doesn't cover the interest, so the balance never goes down."
									>
										Never at this payment
									</span>
								)}
							</TableCell>
							<TableCell>
								<div className="flex justify-end gap-1">
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={`Payments on ${loan.name}`}
										title={canEdit ? "Payments: record or view" : "Payments"}
										onClick={() => onPayments(loan)}
									>
										<History />
									</Button>
									{canEdit && (
										<>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={`Edit ${loan.name}`}
												onClick={() => onEdit(loan)}
											>
												<Pencil />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={`Delete ${loan.name}`}
												onClick={() => onDelete(loan)}
											>
												<Trash2 />
											</Button>
										</>
									)}
								</div>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell>Total</TableCell>
					<TableCell className="text-right tabular-nums">
						{format(totalOwed)}
					</TableCell>
					<TableCell />
					<TableCell className="text-right tabular-nums">
						{format(totalMonthly)}
					</TableCell>
					<TableCell colSpan={3} />
				</TableRow>
			</TableFooter>
		</Table>
	);
}
