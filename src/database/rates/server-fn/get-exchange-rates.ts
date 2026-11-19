import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "#/lib/auth-middleware";
import { currencyCodeSchema, SUPPORTED_CURRENCIES } from "#/lib/currency";

export interface ExchangeRates {
	/** The currency the rates convert from, e.g. "USD". */
	base: string;
	/** The day the rates were published, "yyyy-MM-dd". */
	date: string;
	/** 1 `base` = `rates[code]` of `code`. Includes `base` itself as 1. */
	rates: Record<string, number>;
}

/** European Central Bank reference rates; free and needs no API key. */
const RATES_URL = "https://api.frankfurter.dev/v1/latest";

/** The ECB publishes once per working day, so refetching more often is waste. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// Per server instance. Losing it on a cold start just costs one extra fetch.
const cache = new Map<string, { fetchedAt: number; data: ExchangeRates }>();

async function fetchRates(base: string): Promise<ExchangeRates> {
	const symbols = SUPPORTED_CURRENCIES.filter((c) => c !== base).join(",");
	const res = await fetch(`${RATES_URL}?base=${base}&symbols=${symbols}`);
	if (!res.ok) {
		throw new Error(`Couldn't load exchange rates (${res.status})`);
	}
	const body = (await res.json()) as {
		base: string;
		date: string;
		rates: Record<string, number>;
	};
	return {
		base: body.base,
		date: body.date,
		rates: { ...body.rates, [base]: 1 },
	};
}

/**
 * Today's exchange rates from `base` to every supported display currency.
 * Cached in memory for a few hours.
 */
export const getExchangeRatesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ base: currencyCodeSchema }))
	.handler(async ({ data }) => {
		const hit = cache.get(data.base);
		if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.data;

		const rates = await fetchRates(data.base);
		cache.set(data.base, { fetchedAt: Date.now(), data: rates });
		return rates;
	});
