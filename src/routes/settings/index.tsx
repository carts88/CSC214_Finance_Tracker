import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { THEME_OPTIONS } from "#/lib/theme";

export const Route = createFileRoute("/settings/")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<main className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
			<h1 className="text-3xl font-bold">Settings</h1>
			<AppearanceCard />
		</main>
	);
}

function AppearanceCard() {
	const { theme, setTheme } = useTheme();

	// The saved theme is only known in the browser, so wait until after
	// hydration to mark a choice as selected (avoids a server/client mismatch).
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const selected = mounted ? (theme ?? "system") : undefined;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Appearance</CardTitle>
				<CardDescription>
					Choose how Finance Tracker looks. System follows your device
					setting.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<fieldset>
					<legend className="sr-only">Theme</legend>
					<div className="grid grid-cols-3 gap-3">
						{THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
							<label
								key={value}
								className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground has-checked:border-primary has-checked:bg-accent has-checked:text-accent-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
							>
								<input
									type="radio"
									name="theme"
									value={value}
									checked={selected === value}
									onChange={() => setTheme(value)}
									className="sr-only"
								/>
								<Icon className="size-5" />
								{label}
							</label>
						))}
					</div>
				</fieldset>
			</CardContent>
		</Card>
	);
}
