export type SelectionType = "face" | "body";
export type EntityType = "FACE" | "undefined";

export type PartRequest = {
	onshape: {
		documentId: string;
		workspaceId: string;
		elementId: string;
		kind: string;
		selectionId: string;
		microversionId: string;
		occurrencePath: string;
	};
	part: {
		requestId: string;
		subsystemId: number;
		partName: string;
		machineId: number;
		stockId: number;
		quantity: number;
		cadMassLb: number;
	};
};
