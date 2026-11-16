import type { ReactNode } from "react";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import { TONES, type Tone } from "./tones";

export interface StatBreakdownItem {
	label: ReactNode;
	/** Already formatted, e.g. "$1,204.00", "12", "34%". */
	value: ReactNode;
	tone?: Tone;
}

interface IStatBreakdown {
	items: StatBreakdownItem[];
	/**
	 * - "list": stacked `label ... value` lines (default).
	 * - "row": side-by-side cells, label above value. Wraps on small screens.
	 */
	layout?: "list" | "row";
	/** Shows a skeleton in place of each value. */
	loading?: boolean;
	className?: string;
}

/**
 * A set of labelled values that break a figure down, e.g. "This month /
 * All-time" or "Next 7 / 30 / 90 days". Works on its own in any card or inside
 * `StatCard`'s `breakdown` slot.
 */
export function StatBreakdown({
	items,
	layout = "list",
	loading = false,
	className,
}: IStatBreakdown) {
	if (layout === "row") {
		return (
			<dl
				className={cn(
					"grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-3",
					className,
				)}
			>
				{items.map((item, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: items are positional
						key={i}
						className="flex flex-col gap-1 rounded-lg border bg-muted/40 px-3 py-2"
					>
						<dt className="text-xs text-muted-foreground">{item.label}</dt>
						<dd
							className={cn(
								"text-lg font-semibold tabular-nums",
								TONES[item.tone ?? "neutral"].text,
							)}
						>
							{loading ? <Skeleton className="h-6 w-20" /> : item.value}
						</dd>
					</div>
				))}
			</dl>
		);
	}

	return (
		<dl className={cn("flex flex-col gap-1.5 text-sm", className)}>
			{items.map((item, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: items are positional
					key={i}
					className="flex items-center justify-between gap-4"
				>
					<dt className="text-muted-foreground">{item.label}</dt>
					<dd
						className={cn(
							"font-medium tabular-nums",
							TONES[item.tone ?? "neutral"].text,
						)}
					>
						{loading ? <Skeleton className="h-4 w-16" /> : item.value}
					</dd>
				</div>
			))}
		</dl>
	);
}
