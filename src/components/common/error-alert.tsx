import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";

interface IErrorAlert {
	title: string;
	error: Error;
}

export function ErrorAlert({ title, error }: IErrorAlert) {
	return (
		<Alert variant="destructive">
			<AlertCircle />
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>{error.message}</AlertDescription>
		</Alert>
	);
}
