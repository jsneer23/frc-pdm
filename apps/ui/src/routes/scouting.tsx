import { createFileRoute } from "@tanstack/react-router";
import { ScoutingForm } from "@/scouting/ScoutingForm";

export const Route = createFileRoute("/scouting")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<ScoutingForm />
		</div>
	);
}
