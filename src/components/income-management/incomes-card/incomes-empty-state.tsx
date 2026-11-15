import { Wallet } from "lucide-react";

export function IncomesEmptyState() {
	return (
		<div className="flex flex-col items-center gap-2 py-12 text-center">
			<Wallet className="size-10 text-muted-foreground" />
			<p className="font-medium">No income yet</p>
			<p className="text-sm text-muted-foreground">
				Income you add will show up here.
			</p>
		</div>
	);
}
