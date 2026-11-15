import { IncomeTableSkeleton } from "#/components/income-management/income-table/income-table-skeleton";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

export function IncomesCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-72" />
			</CardHeader>
			<CardContent>
				<IncomeTableSkeleton />
			</CardContent>
		</Card>
	);
}
