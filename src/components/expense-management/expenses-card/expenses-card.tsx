import { useState } from "react";
import { toast } from "sonner";
import { ErrorAlert } from "#/components/common/error-alert";
import { ExpenseTable } from "#/components/expense-management/expense-table/expense-table";
import { ExpenseTableSkeleton } from "#/components/expense-management/expense-table/expense-table-skeleton";
import {
	Card,
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

interface IExpensesCard {
	account: UserAccountRow;
}

export function ExpensesCard({ account }: IExpensesCard) {
	const expenses = useExpenses(account.id);
	const monthTotal = useMonthTotal(account.id);
	const removeExpense = useRemoveExpense(account.id);
	const saveExpense = useSaveExpense(account.id);
	const stopExpense = useStopRecurringExpense(account.id);
	// The expense being edited in the sheet; adding happens from the toolbar.
	const [editing, setEditing] = useState<ExpenseRow>();
	const editable = canWrite(account.role);

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
						? "Edit, stop, and delete the expenses on this account."
						: "You have view-only access to this account."}
				</CardDescription>
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
						onEdit={setEditing}
						onDelete={handleDelete}
						onStop={handleStop}
					/>
				)}
			</CardContent>

			<ExpenseFormSheet
				account={account}
				open={editing !== undefined}
				expense={editing}
				onClose={() => setEditing(undefined)}
			/>
		</Card>
	);
}
