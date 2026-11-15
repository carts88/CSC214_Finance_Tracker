import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorAlert } from "#/components/common/error-alert";
import { IncomeTable } from "#/components/income-management/income-table/income-table";
import { IncomeTableSkeleton } from "#/components/income-management/income-table/income-table-skeleton";
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
import type { IncomeRow } from "#/database/incomes/queries.incomes";
import {
	useIncomeMonthTotal,
	useIncomes,
	useRemoveIncome,
	useSaveIncome,
	useStopRecurringIncome,
} from "#/hooks/incomes/use-incomes";
import { IncomeFormSheet } from "./income-form-sheet";
import { IncomesEmptyState } from "./incomes-empty-state";

/** `null` = sheet closed, `"new"` = adding, a row = editing that income. */
type SheetState = null | "new" | IncomeRow;

interface IIncomesCard {
	account: UserAccountRow;
}

/** The values that re-save `income` exactly as it was (used by Undo). */
function restoreValues(income: IncomeRow) {
	return {
		incomeId: income.id,
		amount: income.amount,
		occurredOn: income.occurred_on,
		source: income.source,
		frequency: income.frequency,
		endDate: income.end_date,
	};
}

export function IncomesCard({ account }: IIncomesCard) {
	const incomes = useIncomes(account.id);
	const monthTotal = useIncomeMonthTotal(account.id);
	const removeIncome = useRemoveIncome(account.id);
	const saveIncome = useSaveIncome(account.id);
	const stopIncome = useStopRecurringIncome(account.id);
	const [sheet, setSheet] = useState<SheetState>(null);
	const editable = canWrite(account.role);
	const editing = sheet !== null && sheet !== "new" ? sheet : undefined;

	function handleDelete(income: IncomeRow) {
		removeIncome.mutate(income.id, {
			onSuccess: () =>
				toast.success("Income deleted", {
					action: {
						label: "Undo",
						// Re-saving with the same id puts the row back.
						onClick: () =>
							saveIncome.mutate(restoreValues(income), {
								onError: () => toast.error("Couldn't restore the income"),
							}),
					},
				}),
			onError: (error) =>
				toast.error("Couldn't delete the income", {
					description: error.message,
				}),
		});
	}

	function handleStop(income: IncomeRow) {
		stopIncome.mutate(income.id, {
			onSuccess: (stopped) =>
				toast.success("Stopped repeating", {
					description: stopped.end_date
						? `Last occurrence: ${stopped.end_date}`
						: undefined,
					action: {
						label: "Undo",
						// Re-saving with the original end date resumes the series.
						onClick: () =>
							saveIncome.mutate(restoreValues(income), {
								onError: () => toast.error("Couldn't resume the income"),
							}),
					},
				}),
			onError: (error) =>
				toast.error("Couldn't stop the income", {
					description: error.message,
				}),
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{account.name} income</CardTitle>
				<CardDescription>
					{editable
						? "Add, edit, and delete the income on this account."
						: "You have view-only access to this account."}
				</CardDescription>
				{editable && (
					<CardAction>
						<Button onClick={() => setSheet("new")}>
							<Plus />
							Add income
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent>
				{incomes.isPending ? (
					<IncomeTableSkeleton />
				) : incomes.isError ? (
					<ErrorAlert title="Couldn't load income" error={incomes.error} />
				) : incomes.data.length === 0 ? (
					<IncomesEmptyState />
				) : (
					<IncomeTable
						incomes={incomes.data}
						currency={account.base_currency}
						monthTotal={monthTotal}
						canEdit={editable}
						onEdit={setSheet}
						onDelete={handleDelete}
						onStop={handleStop}
					/>
				)}
			</CardContent>

			<IncomeFormSheet
				account={account}
				open={sheet !== null}
				income={editing}
				onClose={() => setSheet(null)}
			/>
		</Card>
	);
}
