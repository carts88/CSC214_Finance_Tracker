import { defineChart, lineY, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";
import {
	PROJECTED_DASH,
	VIZ_COLORS,
} from "#/components/reports/utils/report.utils";
import { formatDate } from "#/lib/utils/formatters/dates";

const LINE_COLOR = VIZ_COLORS[0];

export interface NetWorthPoint {
	/** Short axis label, unique per period, e.g. "Nov '26". */
	axisLabel: string;
	/** Day the balance is taken, 'YYYY-MM-DD'. */
	asOf: string;
	/** Whole cents. */
	netWorth: number;
	cash: number;
	assets: number;
	/** A future balance from scheduled items, not what happened. */
	projected: boolean;
}

interface INetWorthChart {
	/** Oldest first, projected points last; needs two or more to draw a line. */
	points: NetWorthPoint[];
	money: (cents: number) => string;
	/** Short money for the y axis, e.g. "$1.2K". */
	moneyCompact: (cents: number) => string;
}

/**
 * Net worth at the end of each period, as a line: solid up to today, dashed
 * through projected periods. Hovering a point shows the date and the
 * cash/asset split behind it.
 */
export function NetWorthChart({ points, money, moneyCompact }: INetWorthChart) {
	const actual = points.filter((p) => !p.projected);
	const hasProjection = actual.length < points.length;
	const definition = useMemo(() => {
		const actualPoints = points.filter((p) => !p.projected);
		// The dashed line starts at today's point so the two lines join.
		const lastActual = actualPoints.at(-1);
		const projectedPoints = [
			...(lastActual ? [lastActual] : []),
			...points.filter((p) => p.projected),
		];
		const crossesZero =
			points.some((p) => p.netWorth < 0) && points.some((p) => p.netWorth > 0);
		return defineChart({
			marks: [
				// A zero line, only when net worth goes both above and below it.
				...(crossesZero ? [ruleY([0], { stroke: "currentColor" })] : []),
				lineY(actualPoints, {
					x: "axisLabel",
					y: "netWorth",
					stroke: LINE_COLOR,
					strokeWidth: 2,
					points: true,
				}),
				...(projectedPoints.length > 1
					? [
							lineY(projectedPoints, {
								x: "axisLabel",
								y: "netWorth",
								stroke: LINE_COLOR,
								strokeWidth: 2,
								strokeDasharray: PROJECTED_DASH,
								points: true,
							}),
						]
					: []),
			],
			scales: {
				x: {
					// A scale instance keeps its domain, so the two lines share one
					// axis in period order.
					scale: scalePoint<string>()
						.domain(points.map((p) => p.axisLabel))
						.padding(0.5),
				},
				y: {
					scale: scaleLinear,
					nice: true,
					grid: true,
					axis: { ticks: { format: (value) => moneyCompact(value) } },
				},
			},
			focus: "nearest-x",
			tooltip: {
				use: tooltip,
				format: ({ datum }) =>
					[
						datum.projected
							? `Projected net worth on ${formatDate(datum.asOf)}`
							: `Net worth on ${formatDate(datum.asOf)}`,
						money(datum.netWorth),
						`Cash: ${money(datum.cash)}`,
						`Assets: ${money(datum.assets)}`,
					].join("\n"),
			},
		});
	}, [points, money, moneyCompact]);

	return (
		<div className="flex flex-col gap-3">
			{hasProjection && (
				<ul className="flex flex-wrap gap-4 text-sm">
					<li className="flex items-center gap-2">
						<LineSwatch />
						Actual
					</li>
					<li className="flex items-center gap-2 text-muted-foreground">
						<LineSwatch dashed />
						Projected
					</li>
				</ul>
			)}
			<Chart
				definition={definition}
				height={260}
				ariaLabel={
					hasProjection
						? "Net worth at the end of each period, then projected"
						: "Net worth at the end of each period"
				}
			/>
		</div>
	);
}

function LineSwatch({ dashed = false }: { dashed?: boolean }) {
	return (
		<svg aria-hidden="true" width="20" height="8" className="shrink-0">
			<line
				x1="0"
				y1="4"
				x2="20"
				y2="4"
				stroke={LINE_COLOR}
				strokeWidth="2"
				strokeDasharray={dashed ? PROJECTED_DASH : undefined}
			/>
		</svg>
	);
}
