import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/features/cards/AuthGateCard";
import { PartRequestPage } from "../features/PartRequestPage";

export const Route = createFileRoute("/onshape")({
	component: OnshapePanel,
});

function OnshapePanel() {
	return (
		<div className="p-4">
			<AuthGate>
				<PartRequestPage />
			</AuthGate>
		</div>
	);
}
