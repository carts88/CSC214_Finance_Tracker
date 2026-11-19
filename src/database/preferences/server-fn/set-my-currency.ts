import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { setUserCurrency } from "#/database/preferences/queries.preferences";
import { authMiddleware } from "#/lib/auth-middleware";
import { currencySchema } from "#/lib/currency";

/** Saves the currency the signed-in user views amounts in. */
export const setMyCurrencyFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ currency: currencySchema }))
	.handler(async ({ data, context }) =>
		setUserCurrency({ userId: context.user.sub, currency: data.currency }),
	);
