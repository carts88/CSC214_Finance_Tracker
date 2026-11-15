import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { UserAccountRow } from "#/database/accounts/queries.accounts";

interface IAccountPicker {
	accounts: UserAccountRow[];
	value: string;
	onChange: (accountId: string) => void;
}

export function AccountPicker({ accounts, value, onChange }: IAccountPicker) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-56" aria-label="Account">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{accounts.map((a) => (
					<SelectItem key={a.id} value={a.id}>
						{a.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
