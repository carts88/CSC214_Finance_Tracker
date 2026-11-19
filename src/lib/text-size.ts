export type TextSize = "sm" | "md" | "lg";

/** Text size choices shown on the settings page. */
export const TEXT_SIZE_OPTIONS: {
	value: TextSize;
	label: string;
	description: string;
}[] = [
	{ value: "sm", label: "SM", description: "Small" },
	{ value: "md", label: "MD", description: "Medium" },
	{ value: "lg", label: "LG", description: "Large" },
];

export const DEFAULT_TEXT_SIZE: TextSize = "md";

/** localStorage key the choice is saved under (per device, like the theme). */
export const TEXT_SIZE_STORAGE_KEY = "text-size";

export const isTextSize = (value: unknown): value is TextSize =>
	value === "sm" || value === "md" || value === "lg";

/**
 * Inline script for <head>: sets `data-text-size` on <html> before the page
 * paints, so it never renders at the wrong size and then jumps. Must stay
 * self-contained since it runs before any bundle loads.
 */
export const TEXT_SIZE_SCRIPT = `try{var s=localStorage.getItem(${JSON.stringify(TEXT_SIZE_STORAGE_KEY)});if(s==="sm"||s==="md"||s==="lg")document.documentElement.dataset.textSize=s}catch(e){}`;

/** The saved text size, or the default if none is saved or storage is blocked. */
export function getSavedTextSize(): TextSize {
	try {
		const saved = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
		return isTextSize(saved) ? saved : DEFAULT_TEXT_SIZE;
	} catch {
		return DEFAULT_TEXT_SIZE;
	}
}

/** Applies the text size to the whole site and remembers it on this device. */
export function setTextSize(size: TextSize) {
	document.documentElement.dataset.textSize = size;
	try {
		localStorage.setItem(TEXT_SIZE_STORAGE_KEY, size);
	} catch {
		// Storage blocked (e.g. private mode): the size still applies for this visit.
	}
}
