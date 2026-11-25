import { Gem, Landmark, type LucideIcon, Minus, Plus } from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { TONES, type Tone } from "./stats/tones";

interface IAddTransactionButtons {
	onAddIncome: () => void;
	onAddExpense: () => void;
	/** Adds an "Add asset" button to the group when given. */
	onAddAsset?: () => void;
	/** Adds an "Add loan" button to the group when given. */
	onAddLoan?: () => void;
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
			aria-label={label}
			title={label}
		>
			<Icon className={TONES[tone].text} strokeWidth={2.5} />
			{/* Icon-only on narrow screens so the whole group fits the toolbar. */}
			<span className="hidden lg:inline">{label}</span>
		</Button>
	);
}

/**
 * "+ Add income | − Add expense" (and optionally "Add asset" / "Add loan")
 * for the top toolbar: one joined, outlined button group so each action is a
 * single click.
 */
export function AddTransactionButtons({
	onAddIncome,
	onAddExpense,
	onAddAsset,
	onAddLoan,
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
			{onAddAsset && (
				<GroupButton
					icon={Gem}
					label="Add asset"
					tone="neutral"
					onClick={onAddAsset}
				/>
			)}
			{onAddLoan && (
				<GroupButton
					icon={Landmark}
					label="Add loan"
					tone="neutral"
					onClick={onAddLoan}
				/>
			)}
		</fieldset>
	);
}
