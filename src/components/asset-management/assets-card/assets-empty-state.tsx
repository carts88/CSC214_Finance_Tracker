import { Gem } from "lucide-react";

export function AssetsEmptyState() {
	return (
		<div className="flex flex-col items-center gap-2 py-12 text-center">
			<Gem className="size-10 text-muted-foreground" />
			<p className="font-medium">No assets yet</p>
			<p className="text-sm text-muted-foreground">
				Assets you add will show up here.
			</p>
		</div>
	);
}
