import { type ComponentProps, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "#/components/ui/input-group";
import { useMoney } from "#/hooks/use-money";
import { currencySymbol } from "#/lib/currency";
import {
	type BaseFieldProps,
	FieldShell,
	useFieldControl,
} from "../field-shell";
import { useFieldContext } from "../form-context";

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
	/**
	 * The account's base currency (ISO 4217) the amount is entered and stored
	 * in. Sets the symbol shown before the input. Defaults to "USD".
	 */
	currency?: string;
} & Omit<
		ComponentProps<typeof InputGroupInput>,
		"id" | "name" | "value" | "onChange" | "onBlur" | "type" | "inputMode"
	>;

/**
 * Money input bound to a `number` field holding **whole cents** (matching the
 * database), while the user types dollars: typing "12.50" stores 1250.
 *
 * Amounts are always entered in the account's own currency, so saved values
 * never pass through an exchange rate. When the user views the site in a
 * different currency, a hint shows the converted amount.
 */
export function CurrencyField({
	label,
	description,
	currency = "USD",
	placeholder = "0.00",
	...inputProps
}: CurrencyFieldProps) {
	const money = useMoney(currency);
	const value = useFieldContext<number>().state.value ?? 0;
	const hint =
		money.isConverted && value > 0
			? `≈ ${money.format(value)} at today's rate`
			: undefined;
	const fullDescription =
		description && hint ? (
			<>
				{description} {hint}
			</>
		) : (
			(description ?? hint)
		);

	const { field, id, invalid, controlProps } = useFieldControl<number>({
		description: fullDescription,
	});
	const symbol = currencySymbol(currency);
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
			description={fullDescription}
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
