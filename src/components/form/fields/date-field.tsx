import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { cn } from "#/lib/utils";
import {
	type BaseFieldProps,
	FieldShell,
	useFieldControl,
} from "../field-shell";

const VALUE_FORMAT = "yyyy-MM-dd";

/**
 * Parses 'YYYY-MM-DD' as a local calendar date. (`new Date("2026-11-14")`
 * would parse it as UTC midnight and can show the previous day.)
 */
function toDate(value: string): Date | undefined {
	if (!value) return undefined;
	const date = parse(value, VALUE_FORMAT, new Date());
	return isValid(date) ? date : undefined;
}

type DateFieldProps = BaseFieldProps & {
	placeholder?: string;
	disabled?: boolean;
	/** How the chosen date is shown on the button (date-fns format). */
	displayFormat?: string;
};

/**
 * Date picker bound to a `string` field holding 'YYYY-MM-DD' (the format
 * Postgres DATE columns use). An empty string means no date picked.
 */
export function DateField({
	label,
	description,
	placeholder = "Pick a date",
	disabled,
	displayFormat = "PPP",
}: DateFieldProps) {
	const { field, id, invalid, controlProps } = useFieldControl<string>({
		description,
	});
	const [open, setOpen] = useState(false);
	const selected = toDate(field.state.value ?? "");

	return (
		<FieldShell
			id={id}
			invalid={invalid}
			label={label}
			description={description}
		>
			<Popover
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) field.handleBlur();
				}}
			>
				<PopoverTrigger asChild>
					<Button
						{...controlProps}
						type="button"
						variant="outline"
						disabled={disabled}
						className={cn(
							"w-full justify-start font-normal",
							!selected && "text-muted-foreground",
						)}
					>
						<CalendarIcon />
						{selected ? format(selected, displayFormat) : placeholder}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={selected}
						defaultMonth={selected}
						onSelect={(date) => {
							field.handleChange(date ? format(date, VALUE_FORMAT) : "");
							setOpen(false);
							field.handleBlur();
						}}
					/>
				</PopoverContent>
			</Popover>
		</FieldShell>
	);
}
