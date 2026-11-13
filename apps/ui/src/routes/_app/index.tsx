import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/features/queue/FilterBar";
import {
	filterParts,
	type QueueSearch,
	validateQueueSearch,
} from "@/features/queue/filters";
import { PartCard } from "@/features/queue/PartCard";
import {
	partsQueueQueryOptions,
	robotsQueryOptions,
} from "@/features/queue/queries";

export const Route = createFileRoute("/_app/")({
	validateSearch: validateQueueSearch,
	component: Home,
});

function Home() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const robots = useQuery(robotsQueryOptions);
	// no robot in the URL means the newest one
	const robotCode = search.robot ?? robots.data?.[0]?.code;
	const parts = useQuery({
		...partsQueueQueryOptions(robotCode ?? ""),
		// wait until there's a robot to ask for
		enabled: robotCode !== undefined,
	});

	// every filter change goes through the URL; undefined removes a parameter
	function changeSearch(
		patch: Partial<QueueSearch>,
		options?: { replace?: boolean },
	) {
		navigate({
			search: (previous) => ({ ...previous, ...patch }),
			replace: options?.replace,
		});
	}

	if (robots.isPending) {
		return <p className="text-muted-foreground">Loading robots…</p>;
	}
	if (robots.error) {
		return (
			<p className="text-destructive">
				Couldn't load robots: {robots.error.message}
			</p>
		);
	}
	if (robotCode === undefined) {
		return (
			<p className="text-muted-foreground">
				No robots yet. An admin can add one.
			</p>
		);
	}

	const visible = parts.data ? filterParts(parts.data, search) : [];

	return (
		<div className="flex flex-col gap-4">
			<FilterBar
				robots={robots.data}
				robotCode={robotCode}
				parts={parts.data ?? []}
				search={search}
				onChange={changeSearch}
			/>

			{parts.isPending ? (
				<p className="text-muted-foreground">Loading parts…</p>
			) : parts.error ? (
				<p className="text-destructive">
					Couldn't load parts: {parts.error.message}
				</p>
			) : visible.length === 0 ? (
				<div className="flex flex-col items-start gap-2">
					<p className="text-muted-foreground">No parts match these filters.</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							changeSearch({
								q: undefined,
								subsystem: undefined,
								machine: undefined,
								material: undefined,
								status: undefined,
							})
						}
					>
						Reset filters
					</Button>
				</div>
			) : (
				<div className="@container">
					<div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
						{visible.map((part) => (
							<PartCard key={part.id} part={part} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
