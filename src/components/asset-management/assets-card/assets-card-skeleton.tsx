import { AssetTableSkeleton } from "#/components/asset-management/asset-table/asset-table-skeleton";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

export function AssetsCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-72" />
			</CardHeader>
			<CardContent>
				<AssetTableSkeleton />
			</CardContent>
		</Card>
	);
}
