import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	usePreferences,
	useSetCurrency,
} from "#/hooks/preferences/use-preferences";
import {
	CURRENCY_LABELS,
	currencySymbol,
	SUPPORTED_CURRENCIES,
} from "#/lib/currency";
import {
	getSavedTextSize,
	setTextSize,
	TEXT_SIZE_OPTIONS,
	type TextSize,
} from "#/lib/text-size";
import { THEME_OPTIONS } from "#/lib/theme";

export const Route = createFileRoute("/settings/")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
			<h1 className="text-3xl font-bold">Settings</h1>
			<AppearanceCard />
			<TextSizeCard />
			<CurrencyCard />
		</div>
	);
}

function CurrencyCard() {
	const preferences = usePreferences();
	const setCurrency = useSetCurrency();
	// Show the choice being saved right away instead of waiting on the server.
	const selected = setCurrency.isPending
		? setCurrency.variables
		: preferences.data?.currency;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Currency</CardTitle>
				<CardDescription>
					Show every amount in this currency. Amounts are converted using
					European Central Bank rates, updated daily; what you've saved doesn't
					change.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<fieldset disabled={!preferences.data}>
					<legend className="sr-only">Display currency</legend>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{SUPPORTED_CURRENCIES.map((code) => (
							<label
								key={code}
								className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground has-checked:border-primary has-checked:bg-accent has-checked:text-accent-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-60"
							>
								<input
									type="radio"
									name="currency"
									value={code}
									checked={selected === code}
									onChange={() =>
										setCurrency.mutate(code, {
											onError: (error) =>
												toast.error("Couldn't save your currency", {
													description: error.message,
												}),
										})
									}
									className="sr-only"
								/>
								<span className="text-base font-semibold">
									{currencySymbol(code)} {code}
								</span>
								<span className="text-xs">{CURRENCY_LABELS[code]}</span>
							</label>
						))}
					</div>
				</fieldset>
			</CardContent>
		</Card>
	);
}

function TextSizeCard() {
	// The saved size lives in this browser, so only read it after hydration
	// (same reason as the theme card below).
	const [selected, setSelected] = useState<TextSize>();
	useEffect(() => setSelected(getSavedTextSize()), []);

	const choose = (size: TextSize) => {
		setTextSize(size);
		setSelected(size);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Text size</CardTitle>
				<CardDescription>
					Make text and spacing smaller or larger across the site. Saved on
					this device.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<fieldset>
					<legend className="sr-only">Text size</legend>
					<div className="grid grid-cols-3 gap-3">
						{TEXT_SIZE_OPTIONS.map(({ value, label, description }) => (
							<label
								key={value}
								className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground has-checked:border-primary has-checked:bg-accent has-checked:text-accent-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
							>
								<input
									type="radio"
									name="text-size"
									value={value}
									checked={selected === value}
									onChange={() => choose(value)}
									className="sr-only"
								/>
								<span className="text-base font-semibold">{label}</span>
								<span className="text-xs">{description}</span>
							</label>
						))}
					</div>
				</fieldset>
			</CardContent>
		</Card>
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
					Choose how Finance Tracker looks. System follows your device setting.
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
