import { Receipt } from "lucide-react";

export function ExpensesEmptyState() {
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
