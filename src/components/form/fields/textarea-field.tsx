import type { ComponentProps } from "react";
import { Textarea } from "#/components/ui/textarea";
import {
	type BaseFieldProps,
	FieldShell,
	useFieldControl,
} from "../field-shell";

type TextareaFieldProps = BaseFieldProps &
	Omit<
		ComponentProps<typeof Textarea>,
		"id" | "name" | "value" | "onChange" | "onBlur"
	>;

/** Multi-line text input bound to a `string` field. */
export function TextareaField({
	label,
	description,
	...textareaProps
}: TextareaFieldProps) {
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
			<Textarea
				{...textareaProps}
				{...controlProps}
				name={field.name}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
			/>
		</FieldShell>
	);
}
