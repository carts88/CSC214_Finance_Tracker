import { useSession } from "@better-auth-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient, getAuthToken } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const navigate = useNavigate();
	const { data, isFetching } = useSession(authClient);
	const signedOut = !data && !isFetching;

	useEffect(() => {
		if (signedOut) {
			void navigate({ to: "/auth/$path", params: { path: "sign-in" } });
		}
	}, [signedOut, navigate]);

	// Calls the protected server route with a Neon Auth JWT; the server
	// verifies it and reads this user's row from Postgres.
	const me = useQuery({
		queryKey: ["me", data?.user.id],
		enabled: Boolean(data?.user),
		queryFn: async () => {
			const token = await getAuthToken();
			const res = await fetch("/api/me", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error(`/api/me returned ${res.status}`);
			return res.json();
		},
	});

	if (!data) return null;

	return (
		<main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
			<h1 className="text-3xl font-bold">Dashboard</h1>
		</main>
	);
}
