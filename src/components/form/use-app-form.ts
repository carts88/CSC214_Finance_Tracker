import { createFormHook } from "@tanstack/react-form";
import { CheckboxField } from "./fields/checkbox-field";
import { CurrencyField } from "./fields/currency-field";
import { DateField } from "./fields/date-field";
import { SelectField } from "./fields/select-field";
import { TextField } from "./fields/text-field";
import { TextareaField } from "./fields/textarea-field";
import { formComponents } from "./form-components";
import { fieldContext, formContext } from "./form-context";

/**
 * The app's form hook. Every form should use this instead of TanStack's plain
 * `useForm` so it gets the shared field/form components:
 *
 * ```tsx
 * const form = useAppForm({ defaultValues, validators: { onSubmit: schema }, onSubmit });
 *
 * <form.AppForm>
 *   <form.Form>
 *     <form.AppField name="amount">
 *       {(field) => <field.CurrencyField label="Amount" />}
 *     </form.AppField>
 *     <form.FormError />
 *     <form.SubmitButton>Save</form.SubmitButton>
 *   </form.Form>
 * </form.AppForm>
 * ```
 *
 * - `withForm` splits a big form into section components that still get the
 *   typed `form` prop.
 * - `withFieldGroup` builds a reusable group of fields (e.g. an address) that
 *   can be dropped into any form whose values contain that shape.
 *
 * To add a new field type, create it in `./fields/` (use `useFieldControl` +
 * `FieldShell`) and register it in `fieldComponents` below.
 */
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		TextareaField,
		CurrencyField,
		DateField,
		SelectField,
		CheckboxField,
	},
	formComponents,
});
