import type { ReactNode } from "react";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import { TONES, type Tone } from "./tones";

export interface StatStripItem {
	label: string;
	/** Already formatted, e.g. "$1,204.00". */
	value: ReactNode;
	tone?: Tone;
	/** One short line of context under the value. */
	note?: ReactNode;
}

interface IStatStrip {
	items: StatStripItem[];
	/** Shows skeletons in place of the values and notes. */
	loading?: boolean;
	className?: string;
}

/**
 * A row of headline numbers in a single bordered bar: two per row on small
 * screens, all four across from `xl`. The 1px gap over a border-coloured
 * background draws the dividers between cells.
 */
export function StatStrip({ items, loading = false, className }: IStatStrip) {
	return (
		<dl
			className={cn(
				"grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border xl:grid-cols-4",
				className,
			)}
		>
			{items.map((item) => (
				<div
					key={item.label}
					className="flex min-w-0 flex-col gap-0.5 bg-card px-4 py-3"
				>
					<dt className="text-xs text-muted-foreground">{item.label}</dt>
					<dd
						className={cn(
							"text-lg font-semibold tabular-nums",
							TONES[item.tone ?? "neutral"].text,
						)}
					>
						{loading ? <Skeleton className="my-1 h-5 w-28" /> : item.value}
					</dd>
					{item.note !== undefined && (
						<dd className="truncate text-xs text-muted-foreground tabular-nums">
							{loading ? <Skeleton className="h-3 w-24" /> : item.note}
						</dd>
					)}
				</div>
			))}
		</dl>
	);
}
