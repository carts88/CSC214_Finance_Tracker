import { format } from "date-fns";

/** One CSV row. Numbers and booleans are written as-is; strings are escaped. */
export type CsvRow = readonly (string | number | boolean)[];

/** Mark an element with this attribute to leave it out of saved images. */
export const SAVE_EXCLUDE_ATTR = "data-save-exclude";

/**
 * A download filename like "income-vs-expenses-2026-11-23.png", from a
 * chart's title and today's date.
 */
export function chartFilename(title: string, extension: "png" | "csv") {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	return `${slug || "chart"}-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
}

function download(href: string, filename: string) {
	const link = document.createElement("a");
	link.href = href;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
}

/** Pixel ratio of saved images, for sharp text. */
const IMAGE_SCALE = 2;
/** Space around the card in a saved image, in CSS pixels. */
const IMAGE_PADDING = 32;

/**
 * The first solid background behind an element (the page color), so a saved
 * card sits on the same color it does on screen.
 */
function backgroundBehind(element: HTMLElement) {
	for (let node = element.parentElement; node; node = node.parentElement) {
		const color = getComputedStyle(node).backgroundColor;
		if (color !== "transparent" && color !== "rgba(0, 0, 0, 0)") return color;
	}
	return getComputedStyle(element).backgroundColor;
}

/**
 * Saves an element (a chart card with its title and legend) as a PNG at 2x,
 * with a margin of page color around it so its border and rounded corners
 * show, in the current light or dark theme. The copy keeps the element's
 * exact on-screen size and layout; children marked with SAVE_EXCLUDE_ATTR,
 * like the save menu itself, are hidden but still take up their space, so
 * nothing around them moves. The screenshot library loads on first use.
 */
export async function saveElementAsPng(element: HTMLElement, filename: string) {
	const { domToCanvas } = await import("modern-screenshot");
	const rect = element.getBoundingClientRect();
	const card = await domToCanvas(element, {
		scale: IMAGE_SCALE,
		// Rounded up so a fractional width doesn't crop the right border.
		width: Math.ceil(rect.width),
		height: Math.ceil(rect.height),
		onCloneEachNode: (node) => {
			if (node instanceof Element && node.hasAttribute(SAVE_EXCLUDE_ATTR)) {
				(node as HTMLElement).style.setProperty(
					"visibility",
					"hidden",
					"important",
				);
			}
		},
	});

	const pad = IMAGE_PADDING * IMAGE_SCALE;
	const canvas = document.createElement("canvas");
	canvas.width = card.width + pad * 2;
	canvas.height = card.height + pad * 2;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D isn't available");
	context.fillStyle = backgroundBehind(element);
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(card, pad, pad);
	download(canvas.toDataURL("image/png"), filename);
}

/**
 * Escapes one CSV field. Text that a spreadsheet would run as a formula
 * (starting with =, +, - or @) gets a leading apostrophe, since names like
 * sources and categories are typed in by users.
 */
function csvField(value: string | number | boolean) {
	if (typeof value !== "string") return String(value);
	const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
	return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * Saves rows as a CSV file. Starts with a byte-order mark so Excel reads
 * non-ASCII names correctly.
 */
export function saveCsv(rows: CsvRow[], filename: string) {
	const text = rows.map((row) => row.map(csvField).join(",")).join("\r\n");
	const blob = new Blob([`﻿${text}\r\n`], {
		type: "text/csv;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	download(url, filename);
	// Give the browser a moment to start the download before freeing it.
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
