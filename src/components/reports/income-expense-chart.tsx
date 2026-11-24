import { barY, defineChart, group } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";
import {
	PROJECTED_DASH,
	projectedFill,
	VIZ_COLORS,
} from "#/components/reports/utils/report.utils";

/** The two bars in each period, in legend and color order. */
const SERIES = ["Income", "Expenses"] as const;
const SERIES_COLORS = [VIZ_COLORS[0], VIZ_COLORS[1]];

export interface IncomeExpensePeriod {
	/** Short axis label, unique per period, e.g. "Nov '26". */
	axisLabel: string;
	/** Full name for the tooltip, e.g. "November 2026". */
	label: string;
	/** Whole cents. */
	income: number;
	expense: number;
	/** Scheduled amounts for a future period, not what happened. */
	projected: boolean;
}

interface IIncomeExpenseChart {
	/** Oldest first, projected periods last. */
	periods: IncomeExpensePeriod[];
	money: (cents: number) => string;
	/** Short money for the y axis, e.g. "$1.2K". */
	moneyCompact: (cents: number) => string;
}

/**
 * Income and expenses side by side for each period. Projected periods are
 * drawn as tinted bars with a dashed outline. Hovering a period shows both
 * amounts and the net.
 */
export function IncomeExpenseChart({
	periods,
	money,
	moneyCompact,
}: IIncomeExpenseChart) {
	const hasProjection = periods.some((p) => p.projected);
	const definition = useMemo(() => {
		const rows = periods.flatMap((p) =>
			SERIES.map((series, i) => ({
				period: p.axisLabel,
				series,
				amount: series === "Income" ? p.income : p.expense,
				color: SERIES_COLORS[i],
				source: p,
			})),
		);
		return defineChart({
			marks: [
				barY(rows, {
					x: "period",
					y: "amount",
					color: "series",
					fill: (d) => (d.source.projected ? projectedFill(d.color) : d.color),
					stroke: (d) => (d.source.projected ? d.color : "none"),
					strokeWidth: 1.5,
					strokeDasharray: (d) =>
						d.source.projected ? PROJECTED_DASH : "none",
					layout: group({ padding: 0.12 }),
					radius: 3,
				}),
			],
			scales: {
				x: { scale: () => scaleBand().padding(0.3) },
				y: {
					scale: scaleLinear,
					nice: true,
					grid: true,
					axis: { ticks: { format: (value) => moneyCompact(value) } },
				},
			},
			color: { domain: [...SERIES], range: SERIES_COLORS },
			focus: "group-x",
			tooltip: {
				use: tooltip,
				formatGroup: (points) => {
					const period = points[0]?.datum.source;
					if (!period) return "";
					return [
						period.projected ? `${period.label} (projected)` : period.label,
						`Income: ${money(period.income)}`,
						`Expenses: ${money(period.expense)}`,
						`Net: ${money(period.income - period.expense)}`,
					].join("\n");
				},
			},
		});
	}, [periods, money, moneyCompact]);

	return (
		<div className="flex flex-col gap-3">
			<ul className="flex flex-wrap gap-4 text-sm">
				{SERIES.map((series, i) => (
					<li key={series} className="flex items-center gap-2">
						<span
							aria-hidden
							className="size-3 rounded-sm"
							style={{ background: SERIES_COLORS[i] }}
						/>
						{series}
					</li>
				))}
				{hasProjection && (
					<li className="flex items-center gap-2 text-muted-foreground">
						<span
							aria-hidden
							className="size-3 rounded-sm border border-dashed border-muted-foreground"
						/>
						Projected
					</li>
				)}
			</ul>
			<Chart
				definition={definition}
				height={280}
				ariaLabel={
					hasProjection
						? "Income and expenses by period, with projected periods"
						: "Income and expenses by period"
				}
			/>
		</div>
	);
}
