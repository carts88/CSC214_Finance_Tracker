import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

/** Column counts at the `lg` breakpoint (Tailwind needs literal classes). */
const LG_COLUMNS = {
	2: "lg:grid-cols-2",
	3: "lg:grid-cols-3",
	4: "lg:grid-cols-4",
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
