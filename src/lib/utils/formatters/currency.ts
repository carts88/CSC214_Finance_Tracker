/**
 * Formats whole cents as money in the given currency, e.g. 1250 -> "$12.50".
 *
 * @param cents whole cents (amounts are stored this way, e.g. $12.50 -> 1250)
 * @param currency ISO 4217 code to display in, e.g. "USD"
 * @param options.negative show the amount as money out: 1250 -> "-$12.50".
 *   Zero stays "$0.00" rather than "-$0.00".
 * @param options.rate exchange rate applied before formatting, when `cents`
 *   is in a different currency than `currency`. Defaults to 1.
 * @param options.compact short form for tight spaces like chart axes:
 *   123456700 -> "$1.2M".
 */
export function formatCents(
	cents: number,
	currency: string,
	{
		negative = false,
		rate = 1,
		compact = false,
	}: { negative?: boolean; rate?: number; compact?: boolean } = {},
): string {
	const amount = (cents / 100) * rate;
	const value = negative && cents !== 0 ? -amount : amount;
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
		...(compact && { notation: "compact", maximumFractionDigits: 1 }),
	}).format(value);
}
