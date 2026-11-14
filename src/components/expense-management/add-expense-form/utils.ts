import { EXPENSE_CATEGORIES } from "#/database/expenses/schemas.expenses";

/** The preset categories, plus the expense's own one if it isn't a preset. */
export function categoryOptions(current?: string) {
    const categories: string[] = [...EXPENSE_CATEGORIES];
    if (current && !categories.includes(current)) categories.push(current);
    return categories.map((category) => ({ value: category, label: category }));
}
