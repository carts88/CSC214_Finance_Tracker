import { toast } from "sonner";
import { AddExpenseForm } from "#/components/expense-management/add-expense-form/add-expense-form";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import type { ExpenseRow } from "#/database/expenses/queries.expenses";

interface IExpenseFormSheet {
	account: UserAccountRow;
	open: boolean;
	/** The expense being edited; omit to add a new one. */
	expense?: ExpenseRow;
	onClose: () => void;
}

export function ExpenseFormSheet({
	account,
	open,
	expense,
	onClose,
}: IExpenseFormSheet) {
	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>{expense ? "Edit expense" : "Add expense"}</SheetTitle>
					<SheetDescription>
						{expense
							? "Update the details of this expense."
							: `Record a new expense on ${account.name}.`}
					</SheetDescription>
				</SheetHeader>
				<div className="px-4 pb-4">
					<AddExpenseForm
						// New key per expense so the form's defaults reload.
						key={expense?.id ?? "new"}
						accountId={account.id}
						expense={expense}
						onSaved={() => {
							toast.success(expense ? "Expense updated" : "Expense added");
							onClose();
						}}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
