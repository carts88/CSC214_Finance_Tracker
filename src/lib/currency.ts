// Kept free of server imports so client components can use these too.
import { z } from "zod";

/**
 * Currencies a user can view the site in. Only currencies with 2 decimal
 * places belong here: amounts are stored as whole cents and every formatter
 * divides by 100 (so e.g. JPY, which has no minor unit, would be wrong).
 */
export const SUPPORTED_CURRENCIES = [
	"USD",
	"CAD",
	"EUR",
	"GBP",
	"AUD",
	"MXN",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
	USD: "US dollar",
	CAD: "Canadian dollar",
	EUR: "Euro",
	GBP: "British pound",
	AUD: "Australian dollar",
	MXN: "Mexican peso",
};

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export const currencySchema = z.enum(SUPPORTED_CURRENCIES);

/** Any ISO 4217-shaped code, e.g. an account's `base_currency`. */
export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export function isSupportedCurrency(code: string): code is CurrencyCode {
	return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

/** "USD" -> "$", "CAD" -> "CA$", "EUR" -> "€" (in an English locale). */
export function currencySymbol(code: string): string {
	try {
		const parts = new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: code,
		}).formatToParts(0);
		return parts.find((p) => p.type === "currency")?.value ?? code;
	} catch {
		// Not a currency Intl knows; show the code itself.
		return code;
	}
}
