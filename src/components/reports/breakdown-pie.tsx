import { defineChart } from "@tanstack/charts";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { Chart } from "@tanstack/charts/react";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";
import {
	type BreakdownSlice,
	formatShare,
} from "#/components/reports/utils/report.utils";
import { cn } from "#/lib/utils";

interface IBreakdownPie {
	slices: BreakdownSlice[];
	/** Whole cents across every slice; shown in the middle of the donut. */
	total: number;
	/** Whole cents -> display money. */
	money: (cents: number) => string;
	ariaLabel: string;
	/** Pixel height; the donut is centered in the full width. */
	height: number;
	/** Text size of the center total. */
	size?: "sm" | "lg";
}

/**
 * A donut of a total split by source or category, built with TanStack
 * Charts. Hovering or keyboard-focusing a slice shows its name, amount and
 * share.
 */
export function BreakdownPie({
	slices,
	total,
	money,
	ariaLabel,
	height,
	size = "lg",
}: IBreakdownPie) {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					polar({
						inset: 4,
						scales: { angle: null, radius: null },
						marks: [
							radialArc(pie(slices, { value: "amount" }), {
								innerRadius: ({ radius }) => radius * 0.62,
								cornerRadius: 3,
								// A thin ring in the card color separates neighboring slices.
								stroke: "var(--card)",
								strokeWidth: 2,
								fill: (slice) => slice.color,
								key: "name",
								states: [
									{ when: { focus: "unmatched" }, style: { opacity: 0.35 } },
								],
							}),
						],
					}),
				],
				scales: { x: null, y: null },
				tooltip: {
					use: tooltip,
					format: ({ datum }) =>
						`${datum.name}\n${money(datum.value)} · ${formatShare(datum.value, total)}`,
				},
			}),
		[slices, total, money],
	);

	return (
		<div className="relative">
			<Chart definition={definition} height={height} ariaLabel={ariaLabel} />
			{/* Center label. Doesn't take pointer events, so slices stay hoverable. */}
			<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-xs text-muted-foreground">Total</span>
				<span
					className={cn(
						"font-semibold tabular-nums",
						size === "lg" ? "text-xl" : "text-sm",
					)}
				>
					{money(total)}
				</span>
			</div>
		</div>
	);
}
