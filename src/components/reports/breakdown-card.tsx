import { BreakdownLegend } from "#/components/reports/breakdown-legend";
import { BreakdownPie } from "#/components/reports/breakdown-pie";
import { ReportCard } from "#/components/reports/report-card";
import type { BreakdownSlice } from "#/components/reports/utils/report.utils";
import type { CsvRow } from "#/components/reports/utils/save-chart";

interface IBreakdownCard {
	title: string;
	description: string;
	slices: BreakdownSlice[];
	/** Whole cents across every slice. */
	total: number;
	money: (cents: number) => string;
	/** Shown instead of the chart when the total is zero. */
	emptyText: string;
	/** The numbers behind the chart, for "Save data". */
	csv?: () => CsvRow[];
}

/**
 * A donut of a total split by source/category, with its legend beneath and a
 * save menu.
 */
export function BreakdownCard({
	title,
	description,
	slices,
	total,
	money,
	emptyText,
	csv,
}: IBreakdownCard) {
	return (
		<ReportCard
			title={title}
			description={description}
			saveName={`${title} ${description}`}
			csv={total === 0 ? undefined : csv}
			contentClassName="flex flex-col gap-4"
		>
			{total === 0 ? (
				<p className="py-16 text-center text-sm text-muted-foreground">
					{emptyText}
				</p>
			) : (
				<>
					<BreakdownPie
						slices={slices}
						total={total}
						money={money}
						height={240}
						ariaLabel={title}
					/>
					<BreakdownLegend slices={slices} total={total} money={money} />
				</>
			)}
		</ReportCard>
	);
}
