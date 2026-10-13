import { createFileRoute } from "@tanstack/react-router";
import { PartRequestPage } from "../features/PartRequestPage";

export const Route = createFileRoute("/onshape")({
	component: OnshapePanel,
});

function OnshapePanel() {
	return (
		<div className="p-4">
			<PartRequestPage />
		</div>
	);
}
