/**
 * Formats whole cents as money in the given currency, e.g. 1250 -> "$12.50".
 *
 * @param cents whole cents (amounts are stored this way, e.g. $12.50 -> 1250)
 * @param currency ISO 4217 code, e.g. "USD"
 * @param options.negative show the amount as money out: 1250 -> "-$12.50".
 *   Zero stays "$0.00" rather than "-$0.00".
 */
export function formatCents(
	cents: number,
	currency: string,
	{ negative = false }: { negative?: boolean } = {},
): string {
	const value = negative && cents !== 0 ? -cents / 100 : cents / 100;
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
	}).format(value);
}
