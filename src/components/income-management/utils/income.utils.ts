import type { IncomeRow } from "#/database/incomes/queries.incomes";
import { INCOME_SOURCES } from "#/database/incomes/schemas.incomes";

/** The preset sources, plus the income's own one if it isn't a preset. */
export function sourceOptions(current?: string) {
	const sources: string[] = [...INCOME_SOURCES];
	if (current && !sources.includes(current)) sources.push(current);
	return sources.map((source) => ({ value: source, label: source }));
}

/** The values that re-save `income` exactly as it was (used by Undo). */
export function incomeRestoreValues(income: IncomeRow) {
	return {
		incomeId: income.id,
		amount: income.amount,
		occurredOn: income.occurred_on,
		source: income.source,
		frequency: income.frequency,
		endDate: income.end_date,
	};
}
