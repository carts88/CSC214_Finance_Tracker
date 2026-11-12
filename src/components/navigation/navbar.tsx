import { useSession } from "@better-auth-ui/react";
import { Link } from "@tanstack/react-router";
import { Menu, Wallet } from "lucide-react";
import { useState } from "react";
import { UserButton } from "#/components/auth/user/user-button";
import { Button } from "#/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "#/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";
import { authClient } from "#/lib/auth-client";
import { NAV_ITEMS } from "./navigation-config";


export function Navbar() {
	const [open, setOpen] = useState(false);
	const { data } = useSession(authClient);

	return (
		<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
				{/* Mobile: hamburger opens a collapsible sidebar */}
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							aria-label="Open navigation"
						>
							<Menu />
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-64 p-0">
						<SheetHeader className="border-b">
							<SheetTitle className="flex items-center gap-2">
								<Wallet className="size-5" />
								Finance Tracker
							</SheetTitle>
						</SheetHeader>
						<nav className="flex flex-col gap-1 p-2">
							{NAV_ITEMS.map(({ label, to, icon: Icon }) => (
								<Link
									key={label}
									to={to}
									onClick={() => setOpen(false)}
									activeOptions={{ exact: true }}
									className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
								>
									<Icon className="size-4" />
									{label}
								</Link>
							))}
						</nav>
					</SheetContent>
				</Sheet>

				<Link to="/" className="flex items-center gap-2 font-semibold">
					<Wallet className="size-5" />
					<span>Finance Tracker</span>
				</Link>

				{/* Desktop: horizontal nav */}
				<NavigationMenu className="hidden md:flex">
					<NavigationMenuList>
						{NAV_ITEMS.map(({ label, to }) => (
							<NavigationMenuItem key={label}>
								<NavigationMenuLink
									asChild
									className={navigationMenuTriggerStyle()}
								>
									<Link
										to={to}
										activeOptions={{ exact: true }}
										className="data-[status=active]:bg-accent/50"
									>
										{label}
									</Link>
								</NavigationMenuLink>
							</NavigationMenuItem>
						))}
					</NavigationMenuList>
				</NavigationMenu>

				<div className="ml-auto">{data && <UserButton size="icon" />}</div>
			</div>
		</header>
	);
}
