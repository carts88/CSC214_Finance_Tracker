import { useSession } from "@better-auth-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Plus, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddExpenseForm } from "#/components/expense-management/add-expense-form/add-expense-form";
import { ExpenseTable } from "#/components/expense-management/expense-table";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { Skeleton } from "#/components/ui/skeleton";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import { canWrite } from "#/database/accounts/roles";
import type { ExpenseRow } from "#/database/expenses/queries.expenses";
import { useMyAccounts } from "#/hooks/accounts/use-my-accounts";
import {
	useExpenses,
	useRemoveExpense,
	useSaveExpense,
} from "#/hooks/expenses/use-expenses";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/expense-management/")({
	component: ExpenseManagementPage,
});

function ExpenseManagementPage() {
	const navigate = useNavigate();
	const { data: session, isFetching } = useSession(authClient);
	const signedOut = !session && !isFetching;

	useEffect(() => {
		if (signedOut) {
			void navigate({ to: "/auth/$path", params: { path: "sign-in" } });
		}
	}, [signedOut, navigate]);

	const accounts = useMyAccounts();
	const [selectedId, setSelectedId] = useState<string>();
	const account =
		accounts.data?.find((a) => a.id === selectedId) ?? accounts.data?.[0];

	if (!session) return null;

	return (
		<main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Expense Management</h1>
				{accounts.data && accounts.data.length > 1 && account && (
					<AccountPicker
						accounts={accounts.data}
						value={account.id}
						onChange={setSelectedId}
					/>
				)}
			</div>

			{accounts.isError ? (
				<ErrorAlert
					title="Couldn't load your accounts"
					error={accounts.error}
				/>
			) : account ? (
				// Remount per account so the open sheet and form reset on switch.
				<ExpensesCard key={account.id} account={account} />
			) : (
				<ExpensesCardSkeleton />
			)}
		</main>
	);
}

function AccountPicker({
	accounts,
	value,
	onChange,
}: {
	accounts: UserAccountRow[];
	value: string;
	onChange: (accountId: string) => void;
}) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-56" aria-label="Account">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{accounts.map((a) => (
					<SelectItem key={a.id} value={a.id}>
						{a.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

/** `null` = sheet closed, `"new"` = adding, a row = editing that expense. */
type SheetState = null | "new" | ExpenseRow;

function ExpensesCard({ account }: { account: UserAccountRow }) {
	const expenses = useExpenses(account.id);
	const removeExpense = useRemoveExpense(account.id);
	const saveExpense = useSaveExpense(account.id);
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
					<TableSkeleton />
				) : expenses.isError ? (
					<ErrorAlert title="Couldn't load expenses" error={expenses.error} />
				) : expenses.data.length === 0 ? (
					<EmptyState />
				) : (
					<ExpenseTable
						expenses={expenses.data}
						currency={account.base_currency}
						canEdit={editable}
						onEdit={setSheet}
						onDelete={handleDelete}
					/>
				)}
			</CardContent>

			<Sheet
				open={sheet !== null}
				onOpenChange={(open) => {
					if (!open) setSheet(null);
				}}
			>
				<SheetContent className="overflow-y-auto">
					<SheetHeader>
						<SheetTitle>{editing ? "Edit expense" : "Add expense"}</SheetTitle>
						<SheetDescription>
							{editing
								? "Update the details of this expense."
								: `Record a new expense on ${account.name}.`}
						</SheetDescription>
					</SheetHeader>
					<div className="px-4 pb-4">
						<AddExpenseForm
							// New key per expense so the form's defaults reload.
							key={editing?.id ?? "new"}
							accountId={account.id}
							expense={editing}
							onSaved={() => {
								toast.success(editing ? "Expense updated" : "Expense added");
								setSheet(null);
							}}
						/>
					</div>
				</SheetContent>
			</Sheet>
		</Card>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center gap-2 py-12 text-center">
			<Receipt className="size-10 text-muted-foreground" />
			<p className="font-medium">No expenses yet</p>
			<p className="text-sm text-muted-foreground">
				Expenses you add will show up here.
			</p>
		</div>
	);
}

function ErrorAlert({ title, error }: { title: string; error: Error }) {
	return (
		<Alert variant="destructive">
			<AlertCircle />
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>{error.message}</AlertDescription>
		</Alert>
	);
}

function TableSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 5 }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
				<Skeleton key={i} className="h-8 w-full" />
			))}
		</div>
	);
}

function ExpensesCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-72" />
			</CardHeader>
			<CardContent>
				<TableSkeleton />
			</CardContent>
		</Card>
	);
}
