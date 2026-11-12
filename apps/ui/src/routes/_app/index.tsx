import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PartCard } from "@/features/queue/PartCard";
import { partsQueueQueryOptions } from "@/features/queue/queries";

export const Route = createFileRoute("/_app/")({ component: Home });

function Home() {
	const { data, error, isPending } = useQuery(partsQueueQueryOptions("26O"));

	if (isPending) {
		return <p className="text-muted-foreground">Loading parts…</p>;
	}
	if (error) {
		return (
			<p className="text-destructive">Couldn't load parts: {error.message}</p>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
			{data.map((part) => (
				<PartCard key={part.id} part={part} />
			))}
		</div>
	);
}
