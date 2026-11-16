import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import { TONES, type Tone } from "./tones";

interface IStatCard {
	label: ReactNode;
	/** The headline figure, already formatted. */
	value: ReactNode;
	icon?: LucideIcon;
	/** Colours the value and icon. */
	tone?: Tone;
	/** A short note under the value, e.g. "to date". */
	description?: ReactNode;
	/** Extra detail under a divider, typically a `StatBreakdown`. */
	breakdown?: ReactNode;
	/** Shows skeletons in place of the value and description. */
	loading?: boolean;
	className?: string;
}

/** A card showing one headline number, with optional context below it. */
export function StatCard({
	label,
	value,
	icon: Icon,
	tone = "neutral",
	description,
	breakdown,
	loading = false,
	className,
}: IStatCard) {
	return (
		<Card className={cn("gap-4", className)}>
			<CardHeader className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium text-muted-foreground">
					{label}
				</span>
				{Icon && (
					<Icon
						className={cn("size-4 text-muted-foreground", TONES[tone].text)}
						aria-hidden
					/>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-1">
				{loading ? (
					<Skeleton className="h-8 w-32" />
				) : (
					<span
						className={cn("text-2xl font-bold tabular-nums", TONES[tone].text)}
					>
						{value}
					</span>
				)}
				{description &&
					(loading ? (
						<Skeleton className="h-4 w-20" />
					) : (
						<span className="text-xs text-muted-foreground">{description}</span>
					))}
			</CardContent>
			{breakdown && (
				<CardContent className="flex flex-col gap-3">
					<Separator />
					{breakdown}
				</CardContent>
			)}
		</Card>
	);
}
