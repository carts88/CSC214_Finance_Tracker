import { Pencil, Trash2 } from "lucide-react";
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
import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import { formatDate } from "#/lib/utils/formatters/dates";

interface IExpenseTable {
	expenses: ExpenseRow[];
	/** ISO 4217 code used to format amounts, e.g. "USD". */
	currency: string;
	/** Hides the edit/delete buttons when false (e.g. for viewers). */
	canEdit: boolean;
	onEdit: (expense: ExpenseRow) => void;
	onDelete: (expense: ExpenseRow) => void;
}


export const ExpenseTable = ({
	expenses,
	currency,
	canEdit,
	onEdit,
	onDelete,
}: IExpenseTable) => {
	const money = new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
	});
	const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Date</TableHead>
					<TableHead>Category</TableHead>
					<TableHead>Description</TableHead>
					<TableHead className="text-right">Amount</TableHead>
					{canEdit && (
						<TableHead className="w-24">
							<span className="sr-only">Actions</span>
						</TableHead>
					)}
				</TableRow>
			</TableHeader>
			<TableBody>
				{expenses.map((expense) => (
					<TableRow key={expense.id}>
						<TableCell className="whitespace-nowrap">
							{formatDate(expense.occurred_on)}
						</TableCell>
						<TableCell>{expense.category}</TableCell>
						<TableCell className="max-w-xs truncate text-muted-foreground">
							{expense.description || "—"}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							{money.format(expense.amount / 100)}
						</TableCell>
						{canEdit && (
							<TableCell>
								<div className="flex justify-end gap-1">
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
				))}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={3}>Total</TableCell>
					<TableCell className="text-right tabular-nums">
						{money.format(total / 100)}
					</TableCell>
					{canEdit && <TableCell />}
				</TableRow>
			</TableFooter>
		</Table>
	);
};
