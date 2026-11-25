import { toast } from "sonner";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import type { LoanRow } from "#/database/loans/queries.loans";
import { LoanForm } from "./loan-form";

interface ILoanFormSheet {
	account: UserAccountRow;
	open: boolean;
	/** The loan being edited; omit to add a new one. */
	loan?: LoanRow;
	onClose: () => void;
}

/** Slide-over holding the add/edit loan form. */
export function LoanFormSheet({
	account,
	open,
	loan,
	onClose,
}: ILoanFormSheet) {
	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>{loan ? "Edit loan" : "Add loan"}</SheetTitle>
					<SheetDescription>
						{loan
							? "Update the details of this loan."
							: `Record a loan or debt ${account.name} owes.`}
					</SheetDescription>
				</SheetHeader>
				<div className="px-4 pb-4">
					<LoanForm
						// New key per loan so the form's defaults reload.
						key={loan?.id ?? "new"}
						accountId={account.id}
						currency={account.base_currency}
						loan={loan}
						onSaved={() => {
							toast.success(loan ? "Loan updated" : "Loan added");
							onClose();
						}}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
