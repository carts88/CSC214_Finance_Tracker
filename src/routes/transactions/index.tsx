
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/transactions/")({ component: Transactions });

function Transactions() {   
 
    return (
        <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
            <h1 className="text-3xl font-bold">Transactions</h1>
        </main>
    );
}
