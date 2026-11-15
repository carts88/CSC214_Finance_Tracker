import { ExpenseTableSkeleton } from "#/components/expense-management/expense-table/expense-table-skeleton";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

export function ExpensesCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-72" />
			</CardHeader>
			<CardContent>
				<ExpenseTableSkeleton />
			</CardContent>
		</Card>
	);
}
