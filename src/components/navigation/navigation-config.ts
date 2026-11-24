import type { LinkProps } from "@tanstack/react-router";
import {
	ArrowLeftRight,
	ChartPie,
	Gem,
	LayoutDashboard,
	type LucideIcon,
	Receipt,
} from "lucide-react";

export type NavItem = {
	label: string;
	to: LinkProps["to"];
	icon: LucideIcon;
};

// Add new pages here; they show up in the sidebar (desktop and mobile).
export const NAV_ITEMS: NavItem[] = [
	{ label: "Dashboard", to: "/", icon: LayoutDashboard },
	{ label: "Finance Management", to: "/finance-management", icon: Receipt },
	{ label: "Asset Management", to: "/asset-management", icon: Gem },
	{ label: "Reports", to: "/reports", icon: ChartPie },
];
