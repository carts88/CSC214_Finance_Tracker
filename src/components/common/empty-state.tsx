import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface IEmptyState {
	icon: LucideIcon;
	title: ReactNode;
	description?: ReactNode;
}

/** Centered icon + message for a card or list with nothing to show. */
export function EmptyState({ icon: Icon, title, description }: IEmptyState) {
	return (
		<div className="flex flex-col items-center gap-2 py-8 text-center">
			<Icon className="size-8 text-muted-foreground" aria-hidden />
			<p className="font-medium">{title}</p>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
		</div>
	);
}
