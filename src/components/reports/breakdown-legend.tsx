import {
	type BreakdownSlice,
	formatShare,
} from "#/components/reports/utils/report.utils";
import { cn } from "#/lib/utils";

interface IBreakdownLegend {
	slices: BreakdownSlice[];
	/** Whole cents across every slice, for the share column. */
	total: number;
	money: (cents: number) => string;
	/** Compact rows for the small per-period cards. */
	dense?: boolean;
}

/**
 * The pie's legend and its exact figures: one row per slice with its color,
 * name, amount and share of the total.
 */
export function BreakdownLegend({
	slices,
	total,
	money,
	dense = false,
}: IBreakdownLegend) {
	return (
		<ul
			className={cn("flex flex-col", dense ? "gap-1 text-xs" : "gap-2 text-sm")}
		>
			{slices.map((slice) => (
				<li key={slice.name} className="flex items-center gap-2">
					<span
						aria-hidden
						className={cn("shrink-0 rounded-sm", dense ? "size-2.5" : "size-3")}
						style={{ background: slice.color }}
					/>
					<span className="min-w-0 flex-1 truncate">{slice.name}</span>
					<span className="font-medium tabular-nums">
						{money(slice.amount)}
					</span>
					<span className="w-10 text-right text-muted-foreground tabular-nums">
						{formatShare(slice.amount, total)}
					</span>
				</li>
			))}
		</ul>
	);
}
