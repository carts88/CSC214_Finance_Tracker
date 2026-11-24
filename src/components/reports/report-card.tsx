import { Download } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type CsvRow,
	chartFilename,
	SAVE_EXCLUDE_ATTR,
	saveCsv,
	saveElementAsPng,
} from "#/components/reports/utils/save-chart";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

interface IReportCard {
	title: string;
	description?: ReactNode;
	/** Name used for saved files, when it should differ from the title. */
	saveName?: string;
	/** The numbers behind the chart, header row first. Omit to hide "Save data". */
	csv?: () => CsvRow[];
	titleClassName?: string;
	contentClassName?: string;
	children: ReactNode;
}

/**
 * A chart card with a save menu in its header: the whole card (title,
 * chart and legend) as a PNG, or the numbers behind it as a CSV.
 */
export function ReportCard({
	title,
	description,
	saveName = title,
	csv,
	titleClassName,
	contentClassName,
	children,
}: IReportCard) {
	const cardRef = useRef<HTMLDivElement>(null);
	const [saving, setSaving] = useState(false);

	async function saveImage() {
		if (!cardRef.current) return;
		setSaving(true);
		try {
			await saveElementAsPng(cardRef.current, chartFilename(saveName, "png"));
		} catch (error) {
			console.error(error);
			toast.error("Couldn't save the image. Please try again.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card ref={cardRef}>
			<CardHeader>
				<CardTitle className={titleClassName}>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
				<CardAction {...{ [SAVE_EXCLUDE_ATTR]: "" }}>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								disabled={saving}
								aria-label={`Save ${title}`}
								title="Save"
							>
								<Download />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={saveImage}>
								Save as image (PNG)
							</DropdownMenuItem>
							{csv && (
								<DropdownMenuItem
									onSelect={() =>
										saveCsv(csv(), chartFilename(saveName, "csv"))
									}
								>
									Save data (CSV)
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</CardAction>
			</CardHeader>
			<CardContent className={contentClassName}>{children}</CardContent>
		</Card>
	);
}
