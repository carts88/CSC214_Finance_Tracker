import { useSession } from "@better-auth-ui/react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { UserButton } from "#/components/auth/user/user-button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "#/components/ui/sidebar";
import { authClient } from "#/lib/auth-client";
import { NAV_ITEMS } from "./navigation-config";

export function AppSidebar() {
	const { data } = useSession(authClient);
	const { state, isMobile, setOpenMobile } = useSidebar();
	const matchRoute = useMatchRoute();
	const collapsed = state === "collapsed" && !isMobile;

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild tooltip="Finance Tracker">
							<Link to="/" onClick={() => setOpenMobile(false)}>
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<Wallet className="size-4" />
								</div>
								<span className="truncate font-semibold">Finance Tracker</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map(({ label, to, icon: Icon }) => (
								<SidebarMenuItem key={label}>
									<SidebarMenuButton
										asChild
										tooltip={label}
										isActive={Boolean(matchRoute({ to }))}
									>
										<Link to={to} onClick={() => setOpenMobile(false)}>
											<Icon />
											<span>{label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{data && (
				<SidebarFooter>
					<UserButton
						size={collapsed ? "icon" : "default"}
						side={isMobile ? "top" : "right"}
						align="end"
						className={collapsed ? "mx-auto" : "w-full justify-start"}
					/>
				</SidebarFooter>
			)}

			<SidebarRail />
		</Sidebar>
	);
}
