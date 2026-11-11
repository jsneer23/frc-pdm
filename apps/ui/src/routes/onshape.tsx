import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/features/auth/AuthGate";
import {
	onshapeMode,
	parentOriginForDisplay,
} from "@/features/onshape/onshapeClient";
import { PartRequestPage } from "@/features/part-request/PartRequestPage";

export const Route = createFileRoute("/onshape")({
	component: OnshapePanel,
});

function OnshapePanel() {
	if (onshapeMode === "rejected") {
		return (
			<p className="p-4 text-sm text-destructive">
				This panel only works inside Onshape. It was opened by{" "}
				{parentOriginForDisplay}.
			</p>
		);
	}
	return (
		<div className="p-4">
			<AuthGate>
				<PartRequestPage />
			</AuthGate>
		</div>
	);
}
