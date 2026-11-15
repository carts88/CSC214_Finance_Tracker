import { type LucideIcon, Minus, Plus } from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface IAddTransactionButtons {
	onAddIncome: () => void;
	onAddExpense: () => void;
}

/** Colour accents: the icon carries the colour, hover adds a faint tint. */
const TONES = {
	// Money in: green +.
	income: {
		icon: "text-chart-4",
		hover: "hover:bg-chart-4/10 dark:hover:bg-chart-4/15",
	},
	// Money out: red -.
	expense: {
		icon: "text-destructive",
		hover: "hover:bg-destructive/10 dark:hover:bg-destructive/15",
	},
} as const;

function GroupButton({
	icon: Icon,
	label,
	tone,
	onClick,
}: {
	icon: LucideIcon;
	label: string;
	tone: keyof typeof TONES;
	onClick: () => void;
}) {
	return (
		<Button
			variant="ghost"
			size="sm"
			// Sharp inner corners; the group's border supplies the outer ones.
			className={cn("h-full rounded-none px-3 font-medium", TONES[tone].hover)}
			onClick={onClick}
		>
			<Icon className={TONES[tone].icon} strokeWidth={2.5} />
			{label}
		</Button>
	);
}

/**
 * "+ Add income | − Add expense" for the top toolbar: one joined, outlined
 * button group so either action is a single click.
 */
export function AddTransactionButtons({
	onAddIncome,
	onAddExpense,
}: IAddTransactionButtons) {
	return (
		<fieldset
			aria-label="Add a transaction"
			className="flex h-8 items-stretch divide-x overflow-hidden rounded-md border bg-background shadow-xs dark:bg-input/30"
		>
			<GroupButton
				icon={Plus}
				label="Add income"
				tone="income"
				onClick={onAddIncome}
			/>
			<GroupButton
				icon={Minus}
				label="Add expense"
				tone="expense"
				onClick={onAddExpense}
			/>
		</fieldset>
	);
}
