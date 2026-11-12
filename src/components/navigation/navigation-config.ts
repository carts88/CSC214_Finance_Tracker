import type { LinkProps } from "@tanstack/react-router";
import { LayoutDashboard, type LucideIcon } from "lucide-react";



export type NavItem = {
    label: string;
    to: LinkProps["to"];
    icon: LucideIcon;
};

// Add new pages here; they show up in both the desktop bar and mobile sidebar.
export const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Transactions", to: "/transactions", icon: LayoutDashboard },
    { label: "Expense Management", to: "/expense-management", icon: LayoutDashboard },
];


