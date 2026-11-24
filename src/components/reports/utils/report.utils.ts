import { format, parse } from "date-fns";
import type { Granularity } from "#/database/reports/constants.reports";
import type { BreakdownRow } from "#/database/reports/queries.reports";

/**
 * Categorical chart colors in fixed order (see --viz-* in styles.css). Slot
 * order matters: neighbors are the pairs checked for color-blind separation.
 */
export const VIZ_COLORS = [
	"var(--viz-1)",
	"var(--viz-2)",
	"var(--viz-3)",
	"var(--viz-4)",
	"var(--viz-5)",
] as const;

/** Dash pattern for projected marks: outlines of future bars, the forecast line. */
export const PROJECTED_DASH = "4 3";

/**
 * Light tint of a series color for a projected bar, so it reads as the same
 * series but not yet real. Works with `var(...)` colors.
 */
export function projectedFill(color: string) {
	return `color-mix(in oklab, ${color} 28%, transparent)`;
}

/**
 * Slice that collects every source/category past the top few. Not "Other",
 * because that's already a suggested income source and expense category.
 */
export const REST_LABEL = "Everything else";
const REST_COLOR = "var(--viz-other)";

/** One pie slice: a source/category, or every small one folded together. */
export interface BreakdownSlice {
	name: string;
	/** Whole cents. */
	amount: number;
	/** Occurrences in the slice. */
	count: number;
	/** CSS color for the slice and its legend swatch. */
	color: string;
}

/**
 * Which sources/categories get their own color. Ranked by total over the
 * whole range, so a category keeps the same color in every period's pie.
 */
export interface BreakdownPalette {
	/** Names that get their own slice, largest first. */
	named: string[];
	colorOf: (name: string) => string;
}

export function buildPalette(rangeTotals: BreakdownRow[]): BreakdownPalette {
	// If folding would leave just one name behind, show it on its own instead
	// of an "Everything else" slice that holds a single item.
	const limit =
		rangeTotals.length === VIZ_COLORS.length + 1
			? rangeTotals.length
			: VIZ_COLORS.length;
	const named = rangeTotals.slice(0, limit).map((row) => row.name);
	const colors = new Map(
		named.map((name, i) => [name, VIZ_COLORS[i] ?? REST_COLOR]),
	);
	return {
		named,
		colorOf: (name) => colors.get(name) ?? REST_COLOR,
	};
}

/**
 * Turns totals into pie slices: named sources/categories keep their own
 * slice (largest first) and the rest fold into one "Everything else" slice
 * at the end.
 */
export function toSlices(
	rows: BreakdownRow[],
	palette: BreakdownPalette,
): BreakdownSlice[] {
	const named = new Set(palette.named);
	const slices: BreakdownSlice[] = [];
	const rest = { amount: 0, count: 0 };
	for (const row of rows) {
		if (named.has(row.name)) {
			slices.push({ ...row, color: palette.colorOf(row.name) });
		} else {
			rest.amount += row.amount;
			rest.count += row.count;
		}
	}
	slices.sort((a, b) => b.amount - a.amount);
	if (rest.amount > 0) {
		slices.push({ name: REST_LABEL, ...rest, color: REST_COLOR });
	}
	return slices;
}

function parseDay(value: string) {
	return parse(value, "yyyy-MM-dd", new Date());
}

/**
 * A period's full name from its first day ('YYYY-MM-DD'), e.g.
 * "Week of Nov 17, 2026", "November 2026", "Q4 2026", "2026".
 */
export function formatPeriod(periodStart: string, granularity: Granularity) {
	const date = parseDay(periodStart);
	switch (granularity) {
		case "week":
			return `Week of ${format(date, "MMM d, yyyy")}`;
		case "month":
			return format(date, "MMMM yyyy");
		case "quarter":
			return format(date, "QQQ yyyy");
		case "year":
			return format(date, "yyyy");
	}
}

/** A period's short name for chart axes, e.g. "Nov 17", "Nov '26", "Q4 '26". */
export function formatPeriodShort(
	periodStart: string,
	granularity: Granularity,
) {
	const date = parseDay(periodStart);
	switch (granularity) {
		case "week":
			return format(date, "MMM d");
		case "month":
			return format(date, "MMM ''yy");
		case "quarter":
			return format(date, "QQQ ''yy");
		case "year":
			return format(date, "yyyy");
	}
}

export const GRANULARITY_LABELS: Record<Granularity, string> = {
	week: "Weekly",
	month: "Monthly",
	quarter: "Quarterly",
	year: "Yearly",
};

/** Singular and plural unit names, e.g. "Last 6 months". */
export const GRANULARITY_UNITS: Record<Granularity, [string, string]> = {
	week: ["week", "weeks"],
	month: ["month", "months"],
	quarter: ["quarter", "quarters"],
	year: ["year", "years"],
};

export function formatShare(part: number, whole: number) {
	if (whole <= 0) return "0%";
	const share = (part / whole) * 100;
	return share > 0 && share < 1 ? "<1%" : `${Math.round(share)}%`;
}
