import type { ComponentProps } from "react";
import { Input } from "#/components/ui/input";
import {
	type BaseFieldProps,
	FieldShell,
	useFieldControl,
} from "../field-shell";

type TextFieldProps = BaseFieldProps &
	Omit<
		ComponentProps<typeof Input>,
		"id" | "name" | "value" | "onChange" | "onBlur"
	>;

/** Single-line text input bound to a `string` field. */
export function TextField({
	label,
	description,
	...inputProps
}: TextFieldProps) {
	const { field, id, invalid, controlProps } = useFieldControl<string>({
		description,
	});

	return (
		<FieldShell
			id={id}
			invalid={invalid}
			label={label}
			description={description}
		>
			<Input
				{...inputProps}
				{...controlProps}
				name={field.name}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
			/>
		</FieldShell>
	);
}
