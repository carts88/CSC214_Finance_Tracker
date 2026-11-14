import type { AnyFormApi } from "@tanstack/react-form";
import type { ComponentProps, FormEvent } from "react";
import { Button } from "#/components/ui/button";
import { FieldError } from "#/components/ui/field";
import { Spinner } from "#/components/ui/spinner";
import { toErrorMessages } from "./field-shell";
import { useFormContext } from "./form-context";

const DEFAULT_SERVER_ERROR = "Something went wrong. Please try again.";

/** Shows `error` (e.g. a failed server function) under `<form.FormError />`. */
export function setFormServerError(form: AnyFormApi, error: unknown) {
	const message =
		error instanceof Error && error.message
			? error.message
			: DEFAULT_SERVER_ERROR;
	form.setErrorMap({ onServer: message });
}

function clearFormServerError(form: AnyFormApi) {
	if (form.state.errorMap.onServer) form.setErrorMap({ onServer: undefined });
}

/**
 * `<form>` element that submits through TanStack Form.
 *
 * If the form's `onSubmit` throws (for example, a server function rejects),
 * the error is caught and shown by `<form.FormError />` instead of crashing.
 */
function Form({
	children,
	...props
}: Omit<ComponentProps<"form">, "onSubmit">) {
	const form = useFormContext();

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		event.stopPropagation();
		// A leftover server error would mark the form invalid and block resubmits.
		clearFormServerError(form);
		try {
			await form.handleSubmit();
		} catch (error) {
			setFormServerError(form, error);
		}
	}

	return (
		<form noValidate {...props} onSubmit={handleSubmit}>
			{children}
		</form>
	);
}

/**
 * Form-level errors: a thrown `onSubmit` error, or an error returned by a
 * form-level validator that isn't tied to one field.
 */
function FormError(props: Omit<ComponentProps<typeof FieldError>, "errors">) {
	const form = useFormContext();
	return (
		<form.Subscribe
			selector={(state) => [state.errorMap.onServer, state.errorMap.onSubmit]}
		>
			{(errors) => (
				<FieldError
					{...props}
					// Form-level validators return `{ fields, form }`; only `form`
					// belongs here (field errors render under their own fields).
					errors={toErrorMessages(
						errors.map((error) =>
							error && typeof error === "object" && "form" in error
								? error.form
								: error,
						),
					)}
				/>
			)}
		</form.Subscribe>
	);
}

/** Submit button that disables itself and shows a spinner while submitting. */
function SubmitButton({
	children,
	disabled,
	...props
}: Omit<ComponentProps<typeof Button>, "type">) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<Button
					{...props}
					type="submit"
					disabled={disabled || isSubmitting}
					aria-busy={isSubmitting || undefined}
				>
					{isSubmitting ? <Spinner data-icon="inline-start" /> : null}
					{children}
				</Button>
			)}
		</form.Subscribe>
	);
}

/** Resets every field to the form's default values. */
function ResetButton({
	children = "Reset",
	onClick,
	...props
}: Omit<ComponentProps<typeof Button>, "type">) {
	const form = useFormContext();
	return (
		<Button
			variant="outline"
			{...props}
			type="button"
			onClick={(event) => {
				form.reset();
				onClick?.(event);
			}}
		>
			{children}
		</Button>
	);
}

export const formComponents = { Form, FormError, SubmitButton, ResetButton };
