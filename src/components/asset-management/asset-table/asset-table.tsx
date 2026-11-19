import { HandCoins, Pencil, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import type { AssetRow } from "#/database/assets/queries.assets";
import { useMoney } from "#/hooks/use-money";
import { formatDate } from "#/lib/utils/formatters/dates";

interface IAssetTable {
	assets: AssetRow[];
	/** The account's base currency (ISO 4217, e.g. "USD") the values are in. */
	currency: string;
	/** Hides the checkboxes and sell/edit/delete buttons when false (viewers). */
	canEdit: boolean;
	onEdit: (asset: AssetRow) => void;
	onDelete: (asset: AssetRow) => void;
	/** Opens the sell form, which records the sale as income. */
	onSell: (asset: AssetRow) => void;
	/** Ids of the checked rows. Only used when `canEdit` is true. */
	selected: ReadonlySet<string>;
	onSelectedChange: (selected: Set<string>) => void;
}

export const AssetTable = ({
	assets,
	currency,
	canEdit,
	onEdit,
	onDelete,
	onSell,
	selected,
	onSelectedChange,
}: IAssetTable) => {
	const { format } = useMoney(currency);
	const total = assets.reduce((sum, asset) => sum + asset.value, 0);

	const selectedCount = assets.filter((r) => selected.has(r.id)).length;
	const allChecked =
		selectedCount === 0
			? false
			: selectedCount === assets.length
				? true
				: "indeterminate";

	function toggleAll(checked: boolean) {
		onSelectedChange(checked ? new Set(assets.map((r) => r.id)) : new Set());
	}

	function toggleRow(id: string, checked: boolean) {
		const next = new Set(selected);
		if (checked) next.add(id);
		else next.delete(id);
		onSelectedChange(next);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					{canEdit && (
						<TableHead className="w-8">
							<Checkbox
								checked={allChecked}
								onCheckedChange={(checked) => toggleAll(checked === true)}
								aria-label="Select all rows"
							/>
						</TableHead>
					)}
					<TableHead>Name</TableHead>
					<TableHead>Category</TableHead>
					<TableHead>Description</TableHead>
					<TableHead>Acquired</TableHead>
					<TableHead className="text-right">Value</TableHead>
					{canEdit && (
						<TableHead className="w-32">
							<span className="sr-only">Actions</span>
						</TableHead>
					)}
				</TableRow>
			</TableHeader>
			<TableBody>
				{assets.map((asset) => {
					const isSelected = canEdit && selected.has(asset.id);
					return (
						<TableRow
							key={asset.id}
							data-state={isSelected ? "selected" : undefined}
						>
							{canEdit && (
								<TableCell>
									<Checkbox
										checked={isSelected}
										onCheckedChange={(checked) =>
											toggleRow(asset.id, checked === true)
										}
										aria-label={`Select ${asset.name}`}
									/>
								</TableCell>
							)}
							<TableCell className="font-medium">{asset.name}</TableCell>
							<TableCell>{asset.category}</TableCell>
							<TableCell className="max-w-xs truncate text-muted-foreground">
								{asset.description || "—"}
							</TableCell>
							<TableCell className="whitespace-nowrap">
								{formatDate(asset.acquired_on)}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{format(asset.value)}
							</TableCell>
							{canEdit && (
								<TableCell>
									<div className="flex justify-end gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Sell ${asset.name}`}
											title="Sell"
											onClick={() => onSell(asset)}
										>
											<HandCoins />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Edit ${asset.name}`}
											onClick={() => onEdit(asset)}
										>
											<Pencil />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Delete ${asset.name}`}
											onClick={() => onDelete(asset)}
										>
											<Trash2 />
										</Button>
									</div>
								</TableCell>
							)}
						</TableRow>
					);
				})}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={canEdit ? 5 : 4}>Total value</TableCell>
					<TableCell className="text-right tabular-nums">
						{format(total)}
					</TableCell>
					{canEdit && <TableCell />}
				</TableRow>
			</TableFooter>
		</Table>
	);
};
