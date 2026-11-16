/**
 * Colour accents shared by stats and money-in/money-out controls.
 * - `text`: colours a value or icon.
 * - `hover`: a faint tinted hover background for buttons.
 */
export const TONES = {
	neutral: {
		text: "",
		hover: "",
	},
	// Money in, or a good number: green.
	positive: {
		text: "text-chart-1",
		hover: "hover:bg-chart-1/10 dark:hover:bg-chart-1/15",
	},
	// Money out, or a bad number: red.
	negative: {
		text: "text-destructive",
		hover: "hover:bg-destructive/10 dark:hover:bg-destructive/15",
	},
} as const;

export type Tone = keyof typeof TONES;
