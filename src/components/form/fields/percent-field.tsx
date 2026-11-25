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
const PERCENT_PATTERN = /^\d*\.?\d{0,2}$/;

/** "5.25" -> 0.0525. Empty input counts as 0. */
function percentToFraction(text: string): number {
	if (text === "" || text === ".") return 0;
	// toFixed avoids float noise like 0.052500000000000005.
	return Number((Number.parseFloat(text) / 100).toFixed(4));
}

/** 0.0525 -> "5.25". 0 shows as an empty input. */
function fractionToPercent(fraction: number): string {
	return fraction ? String(Number((fraction * 100).toFixed(2))) : "";
}

type PercentFieldProps = BaseFieldProps &
	Omit<
		ComponentProps<typeof InputGroupInput>,
		"id" | "name" | "value" | "onChange" | "onBlur" | "type" | "inputMode"
	>;

/**
 * Percent input bound to a `number` field holding a **fraction** (matching
 * the database), while the user types a percent: typing "5.25" stores
 * 0.0525.
 */
export function PercentField({
	label,
	description,
	placeholder = "0.00",
	...inputProps
}: PercentFieldProps) {
	const { field, id, invalid, controlProps } = useFieldControl<number>({
		description,
	});
	const value = field.state.value ?? 0;
	// Keep the raw text so partial input like "5." isn't reformatted mid-typing.
	const [text, setText] = useState(() => fractionToPercent(value));

	// The value changed from outside this input (e.g. `form.reset()`), so
	// replace the text to match.
	if (percentToFraction(text) !== value) {
		setText(fractionToPercent(value));
	}

	return (
		<FieldShell
			id={id}
			invalid={invalid}
			label={label}
			description={description}
		>
			<InputGroup>
				<InputGroupInput
					{...inputProps}
					{...controlProps}
					type="text"
					inputMode="decimal"
					placeholder={placeholder}
					name={field.name}
					value={text}
					onChange={(event) => {
						const next = event.target.value.replace(/[,\s%]/g, "");
						if (!PERCENT_PATTERN.test(next)) return;
						setText(next);
						field.handleChange(percentToFraction(next));
					}}
					onBlur={() => {
						setText(fractionToPercent(value));
						field.handleBlur();
					}}
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupText>%</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
		</FieldShell>
	);
}
