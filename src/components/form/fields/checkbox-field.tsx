import { Checkbox } from "#/components/ui/checkbox";
import {
	type BaseFieldProps,
	FieldShell,
	useFieldControl,
} from "../field-shell";

type CheckboxFieldProps = BaseFieldProps & { disabled?: boolean };

/** Checkbox bound to a `boolean` field, with the label beside it. */
export function CheckboxField({
	label,
	description,
	disabled,
}: CheckboxFieldProps) {
	const { field, id, invalid, controlProps } = useFieldControl<boolean>({
		description,
	});

	return (
		<FieldShell
			id={id}
			invalid={invalid}
			label={label}
			description={description}
			orientation="horizontal"
		>
			<Checkbox
				{...controlProps}
				name={field.name}
				disabled={disabled}
				checked={field.state.value ?? false}
				onCheckedChange={(checked) => field.handleChange(checked === true)}
				onBlur={field.handleBlur}
			/>
		</FieldShell>
	);
}
