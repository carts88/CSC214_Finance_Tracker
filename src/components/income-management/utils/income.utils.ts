import { INCOME_SOURCES } from "#/database/incomes/schemas.incomes";

/** The preset sources, plus the income's own one if it isn't a preset. */
export function sourceOptions(current?: string) {
	const sources: string[] = [...INCOME_SOURCES];
	if (current && !sources.includes(current)) sources.push(current);
	return sources.map((source) => ({ value: source, label: source }));
}
