import { type ComponentProps, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "#/components/ui/input-group";
import {
	type BaseFieldProps,
	FieldShell,
	useFieldControl,
} from "../field-shell";

/** Digits with at most one decimal point and two decimal places. */
const DOLLARS_PATTERN = /^\d*\.?\d{0,2}$/;

/** "12.5" -> 1250. Empty input counts as 0 so validation can reject it. */
function dollarsToCents(text: string): number {
	if (text === "" || text === ".") return 0;
	return Math.round(Number.parseFloat(text) * 100);
}

/** 1250 -> "12.50". 0 shows as an empty input. */
function centsToDollars(cents: number): string {
	return cents ? (cents / 100).toFixed(2) : "";
}

type CurrencyFieldProps = BaseFieldProps & {
	/** Symbol shown before the amount. Defaults to "$". */
	symbol?: string;
} & Omit<
		ComponentProps<typeof InputGroupInput>,
		"id" | "name" | "value" | "onChange" | "onBlur" | "type" | "inputMode"
	>;

/**
 * Money input bound to a `number` field holding **whole cents** (matching the
 * database), while the user types dollars: typing "12.50" stores 1250.
 */
export function CurrencyField({
	label,
	description,
	symbol = "$",
	placeholder = "0.00",
	...inputProps
}: CurrencyFieldProps) {
	const { field, id, invalid, controlProps } = useFieldControl<number>({
		description,
	});
	const value = field.state.value ?? 0;
	// Keep the raw text so partial input like "12." isn't reformatted mid-typing.
	const [text, setText] = useState(() => centsToDollars(value));

	// The value changed from outside this input (e.g. `form.reset()`), so
	// replace the text to match.
	if (dollarsToCents(text) !== value) {
		setText(centsToDollars(value));
	}

	return (
		<FieldShell
			id={id}
			invalid={invalid}
			label={label}
			description={description}
		>
			<InputGroup>
				<InputGroupAddon>
					<InputGroupText>{symbol}</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput
					{...inputProps}
					{...controlProps}
					type="text"
					inputMode="decimal"
					placeholder={placeholder}
					name={field.name}
					value={text}
					onChange={(event) => {
						const next = event.target.value.replace(/[,\s]/g, "");
						if (!DOLLARS_PATTERN.test(next)) return;
						setText(next);
						field.handleChange(dollarsToCents(next));
					}}
					onBlur={() => {
						setText(centsToDollars(value));
						field.handleBlur();
					}}
				/>
			</InputGroup>
		</FieldShell>
	);
}
