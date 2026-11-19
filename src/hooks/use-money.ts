import { usePreferences } from "#/hooks/preferences/use-preferences";
import { useExchangeRates } from "#/hooks/rates/use-exchange-rates";
import { formatCents } from "#/lib/utils/formatters/currency";

/**
 * Formats an account's amounts in the user's chosen display currency.
 *
 * Amounts are stored as cents in the account's `baseCurrency`; this converts
 * them at today's rate for display only. Until the preference and rates have
 * loaded (or if loading rates fails) amounts show unconverted in
 * `baseCurrency`, so a number is never shown under the wrong symbol.
 *
 * @param baseCurrency the account's `base_currency`, e.g. "USD"
 */
export function useMoney(baseCurrency: string) {
	const preferences = usePreferences();
	const wanted = preferences.data?.currency ?? baseCurrency;
	const needsRate = wanted !== baseCurrency;
	const rates = useExchangeRates(baseCurrency, needsRate);

	const rate = needsRate ? rates.data?.rates[wanted] : undefined;
	const isConverted = rate !== undefined;
	const displayCurrency = isConverted ? wanted : baseCurrency;

	return {
		/** Whole cents in `baseCurrency` -> money in `displayCurrency`. */
		format: (cents: number, { negative = false } = {}) =>
			formatCents(cents, displayCurrency, { negative, rate: rate ?? 1 }),
		displayCurrency,
		/** True when amounts are being shown converted from `baseCurrency`. */
		isConverted,
		/** The day the conversion rates were published, when converting. */
		ratesDate: isConverted ? rates.data?.date : undefined,
	};
}
