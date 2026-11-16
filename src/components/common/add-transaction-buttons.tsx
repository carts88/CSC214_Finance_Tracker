import { type LucideIcon, Minus, Plus } from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { TONES, type Tone } from "./stats/tones";

interface IAddTransactionButtons {
	onAddIncome: () => void;
	onAddExpense: () => void;
}

function GroupButton({
	icon: Icon,
	label,
	tone,
	onClick,
}: {
	icon: LucideIcon;
	label: string;
	tone: Tone;
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
			<Icon className={TONES[tone].text} strokeWidth={2.5} />
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
				tone="positive"
				onClick={onAddIncome}
			/>
			<GroupButton
				icon={Minus}
				label="Add expense"
				tone="negative"
				onClick={onAddExpense}
			/>
		</fieldset>
	);
}
