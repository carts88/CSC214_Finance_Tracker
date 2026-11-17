import { Skeleton } from "#/components/ui/skeleton";

export function AssetTableSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 5 }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
				<Skeleton key={i} className="h-8 w-full" />
			))}
		</div>
	);
}
