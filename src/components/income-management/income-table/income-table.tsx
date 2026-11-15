import { CircleStop, Pencil, Repeat, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import type { IncomeRow } from "#/database/incomes/queries.incomes";
import { frequencyLabel } from "#/database/schemas.recurrence";
import { formatDate } from "#/lib/utils/formatters/dates";
import { nextOccurrence } from "#/lib/utils/helpers/recurrence";

interface IIncomeTable {
	incomes: IncomeRow[];
	/** ISO 4217 code used to format amounts, e.g. "USD". */
	currency: string;
	/**
	 * Whole cents earned this month with recurring incomes expanded, or
	 * undefined while it loads. (Summing the rows would count a series once.)
	 */
	monthTotal: number | undefined;
	/** Hides the edit/delete/stop buttons when false (e.g. for viewers). */
	canEdit: boolean;
	onEdit: (income: IncomeRow) => void;
	onDelete: (income: IncomeRow) => void;
	onStop: (income: IncomeRow) => void;
}

/** "Monthly · next Dec 1, 2026", "Weekly · ended Nov 14, 2026", or "—". */
function RepeatsCell({ income }: { income: IncomeRow }) {
	if (income.frequency === "never") {
		return <span className="text-muted-foreground">—</span>;
	}
	const next = nextOccurrence(income);
	const status = next
		? `next ${formatDate(next)}`
		: income.end_date
			? `ended ${formatDate(income.end_date)}`
			: null;
	return (
		<div className="flex items-center gap-1.5 whitespace-nowrap">
			<Repeat className="size-3.5 text-muted-foreground" aria-hidden />
			<span>{frequencyLabel(income.frequency)}</span>
			{status && (
				<span className="text-xs text-muted-foreground">· {status}</span>
			)}
		</div>
	);
}

export const IncomeTable = ({
	incomes,
	currency,
	monthTotal,
	canEdit,
	onEdit,
	onDelete,
	onStop,
}: IIncomeTable) => {
	const money = new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
	});

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Date</TableHead>
					<TableHead>Source</TableHead>
					<TableHead>Repeats</TableHead>
					<TableHead className="text-right">Amount</TableHead>
					{canEdit && (
						<TableHead className="w-32">
							<span className="sr-only">Actions</span>
						</TableHead>
					)}
				</TableRow>
			</TableHeader>
			<TableBody>
				{incomes.map((income) => {
					// Still has occurrences ahead of it (or hasn't started yet).
					const isActiveSeries = nextOccurrence(income) !== null;
					return (
						<TableRow key={income.id}>
							<TableCell className="whitespace-nowrap">
								{formatDate(income.occurred_on)}
							</TableCell>
							<TableCell>{income.source}</TableCell>
							<TableCell>
								<RepeatsCell income={income} />
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{money.format(income.amount / 100)}
							</TableCell>
							{canEdit && (
								<TableCell>
									<div className="flex justify-end gap-1">
										{isActiveSeries && (
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={`Stop repeating ${income.source} income`}
												title="Stop repeating"
												onClick={() => onStop(income)}
											>
												<CircleStop />
											</Button>
										)}
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Edit ${income.source} income`}
											onClick={() => onEdit(income)}
										>
											<Pencil />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Delete ${income.source} income`}
											onClick={() => onDelete(income)}
										>
											<Trash2 />
										</Button>
									</div>
								</TableCell>
							)}
						</TableRow>
					);
				})}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={3}>This month</TableCell>
					<TableCell className="text-right tabular-nums">
						{monthTotal === undefined ? "…" : money.format(monthTotal / 100)}
					</TableCell>
					{canEdit && <TableCell />}
				</TableRow>
			</TableFooter>
		</Table>
	);
};
