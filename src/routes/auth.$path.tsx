import { createFileRoute } from "@tanstack/react-router";
import { Auth } from "#/components/auth/auth";

export const Route = createFileRoute("/auth/$path")({
	component: AuthPage,
});

function AuthPage() {
	const { path } = Route.useParams();
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<Auth path={path} />
		</main>
	);
}
