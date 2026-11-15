import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** id of the empty slot on the right of the top toolbar (see __root.tsx). */
export const HEADER_ACTIONS_ID = "header-actions";

/**
 * Renders `children` into the top toolbar's actions slot, so a page can put
 * its own buttons there. Renders nothing during SSR and on pages without the
 * toolbar; the buttons appear once the page has mounted in the browser.
 */
export function HeaderActions({ children }: { children: ReactNode }) {
	const [slot, setSlot] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setSlot(document.getElementById(HEADER_ACTIONS_ID));
	}, []);

	return slot ? createPortal(children, slot) : null;
}
