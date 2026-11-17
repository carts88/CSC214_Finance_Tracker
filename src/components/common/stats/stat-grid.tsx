import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

/**
 * Column counts on large screens (Tailwind needs literal classes). Four
 * columns waits for `xl`, since four money figures are cramped at `lg` next
 * to the sidebar; until then they sit in a 2 x 2 grid.
 */
const LG_COLUMNS = {
	2: "lg:grid-cols-2",
	3: "lg:grid-cols-3",
	4: "xl:grid-cols-4",
} as const;

interface IStatGrid {
	children: ReactNode;
	/** Columns on large screens; small screens use one or two. */
	columns?: keyof typeof LG_COLUMNS;
	className?: string;
}

/** Responsive grid for a row of `StatCard`s. */
export function StatGrid({ children, columns = 3, className }: IStatGrid) {
	return (
		<div
			className={cn(
				"grid gap-4 sm:grid-cols-2",
				LG_COLUMNS[columns],
				className,
			)}
		>
			{children}
		</div>
	);
}
