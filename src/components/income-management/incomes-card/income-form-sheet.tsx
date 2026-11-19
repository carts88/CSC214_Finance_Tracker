import { toast } from "sonner";
import { AddIncomeForm } from "#/components/income-management/add-income-form/add-income-form";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import type { IncomeRow } from "#/database/incomes/queries.incomes";

interface IIncomeFormSheet {
	account: UserAccountRow;
	open: boolean;
	/** The income being edited; omit to add a new one. */
	income?: IncomeRow;
	onClose: () => void;
}

export function IncomeFormSheet({
	account,
	open,
	income,
	onClose,
}: IIncomeFormSheet) {
	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>{income ? "Edit income" : "Add income"}</SheetTitle>
					<SheetDescription>
						{income
							? "Update the details of this income."
							: `Record new income on ${account.name}.`}
					</SheetDescription>
				</SheetHeader>
				<div className="px-4 pb-4">
					<AddIncomeForm
						// New key per income so the form's defaults reload.
						key={income?.id ?? "new"}
						accountId={account.id}
						currency={account.base_currency}
						income={income}
						onSaved={() => {
							toast.success(income ? "Income updated" : "Income added");
							onClose();
						}}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
