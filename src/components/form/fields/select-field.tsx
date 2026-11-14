import type { ReactNode } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	type BaseFieldProps,
	FieldShell,
	useFieldControl,
} from "../field-shell";

export interface SelectOption {
	value: string;
	label: ReactNode;
	disabled?: boolean;
}

type SelectFieldProps = BaseFieldProps & {
	options: readonly SelectOption[];
	placeholder?: string;
	disabled?: boolean;
};

/** Dropdown bound to a `string` field. An empty string shows the placeholder. */
export function SelectField({
	label,
	description,
	options,
	placeholder = "Select…",
	disabled,
}: SelectFieldProps) {
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
			<Select
				name={field.name}
				value={field.state.value ?? ""}
				disabled={disabled}
				onValueChange={(value) => field.handleChange(value)}
				onOpenChange={(open) => {
					if (!open) field.handleBlur();
				}}
			>
				<SelectTrigger {...controlProps} className="w-full">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem
							key={option.value}
							value={option.value}
							disabled={option.disabled}
						>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FieldShell>
	);
}
