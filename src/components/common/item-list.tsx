import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import { TONES, type Tone } from "./stats/tones";

export interface ItemListItem {
	key: string;
	title: ReactNode;
	/** Secondary line under the title, e.g. a date or category. */
	subtitle?: ReactNode;
	/** Right-aligned figure, already formatted. */
	value: ReactNode;
	/** Small line under the value, e.g. "≈ $4.33/mo". */
	subvalue?: ReactNode;
	icon?: LucideIcon;
	/** Colours the value. */
	tone?: Tone;
}

interface IItemList {
	items: ItemListItem[];
	/** A summary line under the list, e.g. a label on the left and a total on the right. */
	footer?: { label: ReactNode; value: ReactNode };
	/** Shows placeholder rows instead of `items`. */
	loading?: boolean;
	/** Use for a max height + scroll, e.g. "max-h-80". */
	className?: string;
}

/**
 * A compact two-sided list (title/subtitle on the left, value on the right)
 * for narrow spaces like a side panel, where a full table won't fit.
 */
export function ItemList({
	items,
	footer,
	loading = false,
	className,
}: IItemList) {
	if (loading) {
		return (
			<div className="flex flex-col gap-3">
				{Array.from({ length: 4 }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
					<Skeleton key={i} className="h-10 w-full" />
				))}
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<ul className={cn("divide-y overflow-y-auto", className)}>
				{items.map(
					({ key, title, subtitle, value, subvalue, icon: Icon, tone }) => (
						<li key={key} className="flex items-center gap-3 py-2.5">
							{Icon && (
								<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
									<Icon className="size-4" aria-hidden />
								</span>
							)}
							<div className="flex min-w-0 flex-1 flex-col">
								<span className="truncate text-sm font-medium">{title}</span>
								{subtitle && (
									<span className="truncate text-xs text-muted-foreground">
										{subtitle}
									</span>
								)}
							</div>
							<div className="flex shrink-0 flex-col items-end">
								<span
									className={cn(
										"text-sm font-medium tabular-nums",
										TONES[tone ?? "neutral"].text,
									)}
								>
									{value}
								</span>
								{subvalue && (
									<span className="text-xs text-muted-foreground tabular-nums">
										{subvalue}
									</span>
								)}
							</div>
						</li>
					),
				)}
			</ul>
			{footer && (
				<div className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
					<span className="text-muted-foreground">{footer.label}</span>
					<span className="font-semibold tabular-nums">{footer.value}</span>
				</div>
			)}
		</div>
	);
}
