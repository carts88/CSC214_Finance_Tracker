import { ChartColumn } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "#/components/common/empty-state";
import { ErrorAlert } from "#/components/common/error-alert";
import { StatStrip } from "#/components/common/stats/stat-strip";
import { BreakdownCard } from "#/components/reports/breakdown-card";
import { BreakdownLegend } from "#/components/reports/breakdown-legend";
import { BreakdownPie } from "#/components/reports/breakdown-pie";
import { IncomeExpenseChart } from "#/components/reports/income-expense-chart";
import { NetWorthChart } from "#/components/reports/net-worth-chart";
import { ReportCard } from "#/components/reports/report-card";
import {
	buildPalette,
	formatPeriod,
	formatPeriodShort,
	GRANULARITY_LABELS,
	GRANULARITY_UNITS,
	toSlices,
} from "#/components/reports/utils/report.utils";
import type { CsvRow } from "#/components/reports/utils/save-chart";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";
import {
	DEFAULT_GRANULARITY,
	DEFAULT_PERIOD_COUNT,
	DEFAULT_PROJECTION_COUNT,
	GRANULARITIES,
	type Granularity,
	PERIOD_COUNTS,
	type PeriodCount,
	PROJECTION_COUNTS,
	type ProjectionCount,
} from "#/database/reports/constants.reports";
import type { BreakdownRow } from "#/database/reports/queries.reports";
import { useReport } from "#/hooks/reports/use-report";
import { useMoney } from "#/hooks/use-money";

interface IReports {
	account: UserAccountRow;
}

/** Which split the per-period donuts show. */
type PeriodView = "expenses" | "income";

/**
 * Charts for a finance account over a chosen range: totals, income vs
 * expenses per period, net worth over time, income by source and expenses
 * by category (for the whole range and per period). One set of filters
 * drives every chart. Optionally projects income, expenses and net worth a
 * few periods ahead from repeating (and future-dated) items.
 */
export function Reports({ account }: IReports) {
	const [granularity, setGranularity] =
		useState<Granularity>(DEFAULT_GRANULARITY);
	const [periodCount, setPeriodCount] =
		useState<PeriodCount>(DEFAULT_PERIOD_COUNT);
	const [projectionCount, setProjectionCount] = useState<ProjectionCount>(
		DEFAULT_PROJECTION_COUNT,
	);
	const [periodView, setPeriodView] = useState<PeriodView>("expenses");
	const report = useReport(
		account.id,
		granularity,
		periodCount,
		projectionCount,
	);
	const {
		format: money,
		formatCompact: moneyCompact,
		toAmount,
		displayCurrency,
	} = useMoney(account.base_currency);

	const view = useMemo(() => {
		const data = report.data;
		if (!data) return undefined;
		const incomePalette = buildPalette(data.incomeSources);
		const expensePalette = buildPalette(data.expenseCategories);
		const periods = data.periods.map((period) => ({
			...period,
			label: formatPeriod(period.periodStart, data.granularity),
			axisLabel: formatPeriodShort(period.periodStart, data.granularity),
			incomeSlices: toSlices(period.incomeSources, incomePalette),
			expenseSlices: toSlices(period.expenseCategories, expensePalette),
		}));
		const actualPeriods = periods.filter((p) => !p.projected);
		return {
			...data,
			periods,
			actualPeriods,
			incomeSlices: toSlices(data.incomeSources, incomePalette),
			expenseSlices: toSlices(data.expenseCategories, expensePalette),
			/** The current period's balance, i.e. today's net worth. */
			latest: actualPeriods.at(-1),
			/** The last projected period, when projecting. */
			projectedEnd: periods.at(-1)?.projected ? periods.at(-1) : undefined,
		};
	}, [report.data]);

	const [unit, units] = GRANULARITY_UNITS[granularity];
	const rangeLabel =
		periodCount === 1 ? `This ${unit}` : `Last ${periodCount} ${units}`;
	const projectionLabel = (n: number) =>
		n === 0 ? "No projection" : `Project ${n} ${n === 1 ? unit : units} ahead`;
	const net = view ? view.totalIncome - view.totalExpense : 0;

	// CSV exports: plain numbers in the display currency, one row per item.
	const inCurrency = (header: string) => `${header} (${displayCurrency})`;
	const breakdownCsv =
		(rows: BreakdownRow[], total: number, nameHeader: string) =>
		(): CsvRow[] => [
			[nameHeader, inCurrency("Amount"), "Share (%)", "Times"],
			...rows.map((row) => [
				row.name,
				toAmount(row.amount),
				total > 0 ? Math.round((row.amount / total) * 1000) / 10 : 0,
				row.count,
			]),
		];
	const incomeExpenseCsv = (): CsvRow[] => [
		[
			"Period",
			"Start date",
			"Projected",
			inCurrency("Income"),
			inCurrency("Expenses"),
			inCurrency("Net"),
		],
		...(view?.periods ?? []).map((p) => [
			p.label,
			p.periodStart,
			p.projected ? "yes" : "no",
			toAmount(p.income),
			toAmount(p.expense),
			toAmount(p.income - p.expense),
		]),
	];
	const netWorthCsv = (): CsvRow[] => [
		[
			"Date",
			"Projected",
			inCurrency("Net worth"),
			inCurrency("Cash"),
			inCurrency("Assets"),
		],
		...(view?.periods ?? []).map((p) => [
			p.asOf,
			p.projected ? "yes" : "no",
			toAmount(p.netWorth),
			toAmount(p.cash),
			toAmount(p.assets),
		]),
	];
	const isEmpty =
		view &&
		view.totalIncome === 0 &&
		view.totalExpense === 0 &&
		view.periods.every((p) => p.netWorth === 0);

	return (
		<div className="flex flex-col gap-6">
			{/* Filters, in one row above the charts. */}
			<div className="flex flex-wrap items-center gap-3">
				<Select
					value={granularity}
					onValueChange={(value) => setGranularity(value as Granularity)}
				>
					<SelectTrigger className="w-40" aria-label="Group by">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{GRANULARITIES.map((g) => (
							<SelectItem key={g} value={g}>
								{GRANULARITY_LABELS[g]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={String(periodCount)}
					onValueChange={(value) =>
						setPeriodCount(Number(value) as PeriodCount)
					}
				>
					<SelectTrigger className="w-44" aria-label="Range">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{PERIOD_COUNTS.map((n) => (
							<SelectItem key={n} value={String(n)}>
								{n === 1 ? `This ${unit}` : `Last ${n} ${units}`}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={String(projectionCount)}
					onValueChange={(value) =>
						setProjectionCount(Number(value) as ProjectionCount)
					}
				>
					<SelectTrigger className="w-52" aria-label="Projection">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{PROJECTION_COUNTS.map((n) => (
							<SelectItem key={n} value={String(n)}>
								{projectionLabel(n)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-sm text-muted-foreground">
					Repeating items count each time they happen.
					{projectionCount > 0 &&
						" Projections assume they keep going as scheduled."}
				</span>
			</div>

			{report.isError ? (
				<ErrorAlert title="Couldn't load your report" error={report.error} />
			) : !view ? (
				<ReportsSkeleton />
			) : isEmpty ? (
				<Card>
					<CardContent>
						<EmptyState
							icon={ChartColumn}
							title="Nothing to report yet"
							description="Income, expenses and assets you add show up here."
						/>
					</CardContent>
				</Card>
			) : (
				<>
					<StatStrip
						items={[
							{
								label: "Income",
								value: money(view.totalIncome),
								tone: "positive",
								note: rangeLabel,
							},
							{
								label: "Expenses",
								value: money(view.totalExpense, { negative: true }),
								tone: "negative",
								note: rangeLabel,
							},
							{
								label: "Net",
								value: money(Math.abs(net), { negative: net < 0 }),
								tone: net < 0 ? "negative" : "positive",
								note: "Income minus expenses",
							},
							{
								label: "Net worth",
								value: money(view.latest?.netWorth ?? 0),
								note: view.projectedEnd
									? `Today · ${moneyCompact(view.projectedEnd.netWorth)} projected by ${view.projectedEnd.axisLabel}`
									: "Today",
							},
						]}
					/>

					<ReportCard
						title="Income vs expenses"
						description={
							<>
								{GRANULARITY_LABELS[granularity]} totals,{" "}
								{rangeLabel.toLowerCase()}
								{view.projectedEnd &&
									`, then ${projectionCount} ${units} projected from repeating and future-dated items`}
								.
							</>
						}
						csv={incomeExpenseCsv}
					>
						<IncomeExpenseChart
							periods={view.periods}
							money={money}
							moneyCompact={moneyCompact}
						/>
					</ReportCard>

					<ReportCard
						title="Net worth"
						description={
							<>
								Income minus expenses to date, plus assets held, at the end of
								each {unit}. Assets count at their current value.
								{view.projectedEnd &&
									" The dashed part assumes repeating items continue and nothing else changes."}
							</>
						}
						csv={netWorthCsv}
					>
						{view.periods.length > 1 ? (
							<NetWorthChart
								points={view.periods}
								money={money}
								moneyCompact={moneyCompact}
							/>
						) : (
							<p className="py-8 text-center text-sm text-muted-foreground">
								Pick a range longer than one {unit} to see how your net worth
								changes.
							</p>
						)}
					</ReportCard>

					<div className="grid gap-6 lg:grid-cols-2">
						<BreakdownCard
							title="Income by source"
							description={rangeLabel}
							slices={view.incomeSlices}
							total={view.totalIncome}
							money={money}
							emptyText="No income in this range"
							csv={breakdownCsv(view.incomeSources, view.totalIncome, "Source")}
						/>
						<BreakdownCard
							title="Expenses by category"
							description={rangeLabel}
							slices={view.expenseSlices}
							total={view.totalExpense}
							money={money}
							emptyText="No spending in this range"
							csv={breakdownCsv(
								view.expenseCategories,
								view.totalExpense,
								"Category",
							)}
						/>
					</div>

					{view.actualPeriods.length > 1 && (
						<section className="flex flex-col gap-3">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 className="text-lg font-semibold">By {unit}</h2>
								<div className="flex gap-1 rounded-lg border p-1">
									{(["expenses", "income"] as const).map((v) => (
										<Button
											key={v}
											size="xs"
											variant={periodView === v ? "secondary" : "ghost"}
											aria-pressed={periodView === v}
											onClick={() => setPeriodView(v)}
										>
											{v === "expenses" ? "Expenses" : "Income"}
										</Button>
									))}
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{/* Newest first: the current period is what people check most. */}
								{[...view.actualPeriods].reverse().map((period) => {
									const slices =
										periodView === "expenses"
											? period.expenseSlices
											: period.incomeSlices;
									const total =
										periodView === "expenses" ? period.expense : period.income;
									const splitName =
										periodView === "expenses"
											? "Expenses by category"
											: "Income by source";
									return (
										<ReportCard
											key={period.periodStart}
											title={period.label}
											description={splitName}
											saveName={`${splitName} ${period.label}`}
											csv={
												total === 0
													? undefined
													: periodView === "expenses"
														? breakdownCsv(
																period.expenseCategories,
																total,
																"Category",
															)
														: breakdownCsv(
																period.incomeSources,
																total,
																"Source",
															)
											}
											titleClassName="text-base"
											contentClassName="flex flex-col gap-4"
										>
											{total === 0 ? (
												<p className="py-12 text-center text-sm text-muted-foreground">
													{periodView === "expenses"
														? "Nothing spent"
														: "No income"}
												</p>
											) : (
												<>
													<BreakdownPie
														slices={slices}
														total={total}
														money={money}
														height={180}
														size="sm"
														ariaLabel={`${splitName}, ${period.label}`}
													/>
													<BreakdownLegend
														slices={slices}
														total={total}
														money={money}
														dense
													/>
												</>
											)}
										</ReportCard>
									);
								})}
							</div>
						</section>
					)}
				</>
			)}
		</div>
	);
}

function ReportsSkeleton() {
	return (
		<>
			<Skeleton className="h-20 w-full rounded-xl" />
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-72" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 w-full" />
				</CardContent>
			</Card>
		</>
	);
}
