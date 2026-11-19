import { skipToken, useQuery } from "@tanstack/react-query";
import { getExchangeRatesFn } from "#/database/rates/server-fn/get-exchange-rates";

export const rateKeys = {
	from: (base: string) => ["exchange-rates", base] as const,
};

/**
 * Today's exchange rates from `base`. Idle when `enabled` is false (no
 * conversion needed). Rates change once a day, so they're kept for an hour.
 */
export function useExchangeRates(base: string, enabled: boolean) {
	return useQuery({
		queryKey: rateKeys.from(base),
		queryFn: enabled ? () => getExchangeRatesFn({ data: { base } }) : skipToken,
		staleTime: 60 * 60 * 1000,
		retry: 1,
	});
}
