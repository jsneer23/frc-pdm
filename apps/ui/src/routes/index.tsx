import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-4">
			<h1 className="text-xl font-semibold">FRC Parts Manager</h1>
		</div>
	);
}
