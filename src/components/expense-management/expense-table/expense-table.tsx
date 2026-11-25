import { CircleStop, Landmark, Pencil, Repeat, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import { frequencyLabel } from "#/database/schemas.recurrence";
import { useMoney } from "#/hooks/use-money";
import { formatDate } from "#/lib/utils/formatters/dates";
import { nextOccurrence } from "#/lib/utils/helpers/recurrence";

interface IExpenseTable {
	expenses: ExpenseRow[];
	/** ISO 4217 code used to format amounts, e.g. "USD". */
	currency: string;
	/**
	 * Whole cents spent this month with recurring expenses expanded, or
	 * undefined while it loads. (Summing the rows would count a series once.)
	 */
	monthTotal: number | undefined;
	/** Hides the edit/delete/stop buttons when false (e.g. for viewers). */
	canEdit: boolean;
	onEdit: (expense: ExpenseRow) => void;
	onDelete: (expense: ExpenseRow) => void;
	onStop: (expense: ExpenseRow) => void;
	/** Ids of the checked rows. Only used when `canEdit` is true. */
	selected: ReadonlySet<string>;
	onSelectedChange: (selected: Set<string>) => void;
}

/** "Monthly · next Dec 1, 2026", "Weekly · ended Nov 14, 2026", or "—". */
function RepeatsCell({ expense }: { expense: ExpenseRow }) {
	if (expense.frequency === "never") {
		return <span className="text-muted-foreground">—</span>;
	}
	const next = nextOccurrence(expense);
	const status = next
		? `next ${formatDate(next)}`
		: expense.end_date
			? `ended ${formatDate(expense.end_date)}`
			: null;
	return (
		<div className="flex items-center gap-1.5 whitespace-nowrap">
			<Repeat className="size-3.5 text-muted-foreground" aria-hidden />
			<span>{frequencyLabel(expense.frequency)}</span>
			{status && (
				<span className="text-xs text-muted-foreground">· {status}</span>
			)}
		</div>
	);
}

export const ExpenseTable = ({
	expenses,
	currency,
	monthTotal,
	canEdit,
	onEdit,
	onDelete,
	onStop,
	selected,
	onSelectedChange,
}: IExpenseTable) => {
	const money = useMoney(currency);
	// Expenses are stored as positive cents but shown as money out: -$12.50.
	// (A zero total stays "$0.00" rather than "-$0.00".)
	const asNegative = (cents: number) => money.format(cents, { negative: true });

	const selectedCount = expenses.filter((r) => selected.has(r.id)).length;
	const allChecked =
		selectedCount === 0
			? false
			: selectedCount === expenses.length
				? true
				: "indeterminate";

	function toggleAll(checked: boolean) {
		onSelectedChange(checked ? new Set(expenses.map((r) => r.id)) : new Set());
	}

	function toggleRow(id: string, checked: boolean) {
		const next = new Set(selected);
		if (checked) next.add(id);
		else next.delete(id);
		onSelectedChange(next);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					{canEdit && (
						<TableHead className="w-8">
							<Checkbox
								checked={allChecked}
								onCheckedChange={(checked) => toggleAll(checked === true)}
								aria-label="Select all rows"
							/>
						</TableHead>
					)}
					<TableHead>Date</TableHead>
					<TableHead>Category</TableHead>
					<TableHead>Description</TableHead>
					<TableHead>Repeats</TableHead>
					<TableHead className="text-right">Amount</TableHead>
					{canEdit && (
						<TableHead className="w-32">
							<span className="sr-only">Actions</span>
						</TableHead>
					)}
				</TableRow>
			</TableHeader>
			<TableBody>
				{expenses.map((expense) => {
					// Still has occurrences ahead of it (or hasn't started yet).
					const isActiveSeries = nextOccurrence(expense) !== null;
					const isSelected = canEdit && selected.has(expense.id);
					return (
						<TableRow
							key={expense.id}
							data-state={isSelected ? "selected" : undefined}
						>
							{canEdit && (
								<TableCell>
									<Checkbox
										checked={isSelected}
										onCheckedChange={(checked) =>
											toggleRow(expense.id, checked === true)
										}
										aria-label={`Select ${expense.category} expense`}
									/>
								</TableCell>
							)}
							<TableCell className="whitespace-nowrap">
								{formatDate(expense.occurred_on)}
							</TableCell>
							<TableCell>
								{expense.loan_id ? (
									<span
										className="inline-flex items-center gap-1.5"
										title="Payment on this loan"
									>
										<Landmark
											className="size-3.5 text-muted-foreground"
											aria-label="Loan payment"
										/>
										{expense.category}
									</span>
								) : (
									expense.category
								)}
							</TableCell>
							<TableCell className="max-w-xs truncate text-muted-foreground">
								{expense.description || "—"}
							</TableCell>
							<TableCell>
								<RepeatsCell expense={expense} />
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{asNegative(expense.amount)}
							</TableCell>
							{canEdit && (
								<TableCell>
									<div className="flex justify-end gap-1">
										{isActiveSeries && (
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={`Stop repeating ${expense.category} expense`}
												title="Stop repeating"
												onClick={() => onStop(expense)}
											>
												<CircleStop />
											</Button>
										)}
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Edit ${expense.category} expense`}
											onClick={() => onEdit(expense)}
										>
											<Pencil />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Delete ${expense.category} expense`}
											onClick={() => onDelete(expense)}
										>
											<Trash2 />
										</Button>
									</div>
								</TableCell>
							)}
						</TableRow>
					);
				})}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={canEdit ? 5 : 4}>This month</TableCell>
					<TableCell className="text-right tabular-nums">
						{monthTotal === undefined ? "…" : asNegative(monthTotal)}
					</TableCell>
					{canEdit && <TableCell />}
				</TableRow>
			</TableFooter>
		</Table>
	);
};
