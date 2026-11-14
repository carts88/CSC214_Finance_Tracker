import { createFormHookContexts } from "@tanstack/react-form";

/**
 * Shared React contexts for the app's TanStack forms.
 *
 * Field components call `useFieldContext<T>()` to get the field they're bound
 * to; form components call `useFormContext()` to get the whole form. Both are
 * provided automatically by `form.AppField` and `form.AppForm` from
 * `useAppForm` (see `./use-app-form.ts`).
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();
