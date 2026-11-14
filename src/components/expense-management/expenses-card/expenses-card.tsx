import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorAlert } from "#/components/common/error-alert";
import { ExpenseTable } from "#/components/expense-management/expense-table/expense-table";
import { ExpenseTableSkeleton } from "#/components/expense-management/expense-table/expense-table-skeleton";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { canWrite } from "#/database/accounts/roles";
import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import {
	useExpenses,
	useMonthTotal,
	useRemoveExpense,
	useSaveExpense,
	useStopRecurringExpense,
} from "#/hooks/expenses/use-expenses";
import { ExpenseFormSheet } from "./expense-form-sheet";
import { ExpensesEmptyState } from "./expenses-empty-state";

/** `null` = sheet closed, `"new"` = adding, a row = editing that expense. */
type SheetState = null | "new" | ExpenseRow;

interface IExpensesCard {
	account: UserAccountRow;
}

export function ExpensesCard({ account }: IExpensesCard) {
	const expenses = useExpenses(account.id);
	const monthTotal = useMonthTotal(account.id);
	const removeExpense = useRemoveExpense(account.id);
	const saveExpense = useSaveExpense(account.id);
	const stopExpense = useStopRecurringExpense(account.id);
	const [sheet, setSheet] = useState<SheetState>(null);
	const editable = canWrite(account.role);
	const editing = sheet !== null && sheet !== "new" ? sheet : undefined;

	function handleDelete(expense: ExpenseRow) {
		removeExpense.mutate(expense.id, {
			onSuccess: () =>
				toast.success("Expense deleted", {
					action: {
						label: "Undo",
						// Re-saving with the same id puts the row back.
						onClick: () =>
							saveExpense.mutate(
								{
									expenseId: expense.id,
									amount: expense.amount,
									occurredOn: expense.occurred_on,
									category: expense.category,
									description: expense.description,
									frequency: expense.frequency,
									endDate: expense.end_date,
								},
								{
									onError: () => toast.error("Couldn't restore the expense"),
								},
							),
					},
				}),
			onError: (error) =>
				toast.error("Couldn't delete the expense", {
					description: error.message,
				}),
		});
	}

	function handleStop(expense: ExpenseRow) {
		stopExpense.mutate(expense.id, {
			onSuccess: (stopped) =>
				toast.success("Stopped repeating", {
					description: stopped.end_date
						? `Last occurrence: ${stopped.end_date}`
						: undefined,
					action: {
						label: "Undo",
						// Re-saving with the original end date resumes the series.
						onClick: () =>
							saveExpense.mutate(
								{
									expenseId: expense.id,
									amount: expense.amount,
									occurredOn: expense.occurred_on,
									category: expense.category,
									description: expense.description,
									frequency: expense.frequency,
									endDate: expense.end_date,
								},
								{
									onError: () => toast.error("Couldn't resume the expense"),
								},
							),
					},
				}),
			onError: (error) =>
				toast.error("Couldn't stop the expense", {
					description: error.message,
				}),
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{account.name} expenses</CardTitle>
				<CardDescription>
					{editable
						? "Add, edit, and delete the expenses on this account."
						: "You have view-only access to this account."}
				</CardDescription>
				{editable && (
					<CardAction>
						<Button onClick={() => setSheet("new")}>
							<Plus />
							Add expense
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent>
				{expenses.isPending ? (
					<ExpenseTableSkeleton />
				) : expenses.isError ? (
					<ErrorAlert title="Couldn't load expenses" error={expenses.error} />
				) : expenses.data.length === 0 ? (
					<ExpensesEmptyState />
				) : (
					<ExpenseTable
						expenses={expenses.data}
						currency={account.base_currency}
						monthTotal={monthTotal}
						canEdit={editable}
						onEdit={setSheet}
						onDelete={handleDelete}
						onStop={handleStop}
					/>
				)}
			</CardContent>

			<ExpenseFormSheet
				account={account}
				open={sheet !== null}
				expense={editing}
				onClose={() => setSheet(null)}
			/>
		</Card>
	);
}
