import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";

export type ThemeValue = "light" | "dark" | "system";

/** Theme choices shown in the user dropdown and on the settings page. */
export const THEME_OPTIONS: {
	value: ThemeValue;
	label: string;
	icon: LucideIcon;
}[] = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];
