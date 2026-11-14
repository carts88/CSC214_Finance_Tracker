import { type ReactNode, useId } from "react";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "#/components/ui/field";
import { useFieldContext } from "./form-context";

/** Props every field component accepts on top of its control's own props. */
export interface BaseFieldProps {
	label: ReactNode;
	description?: ReactNode;
}

/**
 * Turns TanStack Form's error list (strings from inline validators, or
 * `{ message }` objects from zod/Standard Schema) into `{ message }` objects
 * for shadcn's `FieldError`.
 */
export function toErrorMessages(
	errors: readonly unknown[],
): { message: string }[] {
	return errors.flatMap((error) => {
		if (typeof error === "string") return error ? [{ message: error }] : [];
		if (error && typeof error === "object" && "message" in error) {
			return [{ message: String(error.message) }];
		}
		return [];
	});
}

/**
 * Shared wiring for a field component: the bound field, a unique DOM id, and
 * whether to show it as invalid. Errors only show once the field is touched,
 * or after a submit attempt (TanStack marks every field touched on submit).
 */
export function useFieldControl<TValue>({
	description,
}: Pick<BaseFieldProps, "description">) {
	const field = useFieldContext<TValue>();
	const id = useId(); // this is nessecary to ensure that the id is unique across multiple instances of the same field component
	const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
	const describedBy =
		[description && `${id}-description`, invalid && `${id}-error`]
			.filter(Boolean)
			.join(" ") || undefined;

	return {
		field,
		id,
		invalid,
		/** Spread onto the control so screen readers get the label/error state. */
		controlProps: {
			id,
			"aria-invalid": invalid,
			"aria-describedby": describedBy,
		},
	};
}

interface FieldShellProps extends BaseFieldProps {
	id: string;
	invalid: boolean;
	/** "horizontal" puts the control before the label (checkboxes, switches). */
	orientation?: "vertical" | "horizontal";
	children: ReactNode;
}

/** Label + control + description + error layout used by every field. */
export function FieldShell({
	id,
	invalid,
	label,
	description,
	orientation = "vertical",
	children,
}: FieldShellProps) {
	const field = useFieldContext<unknown>();
	const errors = invalid ? toErrorMessages(field.state.meta.errors) : [];

	const details = (
		<>
			{description ? (
				<FieldDescription id={`${id}-description`}>
					{description}
				</FieldDescription>
			) : null}
			<FieldError id={`${id}-error`} errors={errors} />
		</>
	);

	if (orientation === "horizontal") {
		return (
			<Field orientation="horizontal" data-invalid={invalid}>
				{children}
				<FieldContent>
					<FieldLabel htmlFor={id}>{label}</FieldLabel>
					{details}
				</FieldContent>
			</Field>
		);
	}

	return (
		<Field data-invalid={invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			{children}
			{details}
		</Field>
	);
}
