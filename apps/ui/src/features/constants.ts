export type SelectionType = "face" | "body";
export type EntityType = "FACE" | "undefined";

export type MachineId = (typeof PART_TYPES)[PartTypeId]["machines"][number];

type ProcessDef = {
	label: string;
	description: string;
	machines: string[];
};

export const PART_TYPES = {
	sheet: {
		label: "Sheet",
		description: "SRPP, Lexan, or Aluminum",
		machines: ["co2_laser", "router"],
	},
	extrusion: {
		label: "Extrusion",
		description: "Tube, Maxspline, etc.",
		machines: ["saw"],
	},
	print_3d: {
		label: "3D Print",
		description: "PLA+, TPU, etc.",
		machines: ["printer"],
	},
	shaft_stock: {
		label: "Shaft",
		description: "Hex or Round Stock",
		machines: ["lathe"],
	},
} as const satisfies Record<string, ProcessDef>;

export type PartTypeId = keyof typeof PART_TYPES;

export type PartRequest = {
	document: {
		userId: string;
		documentId: string;
		workspaceId: string;
		elementId: string;
	};
	selection: {
		kind: string;
		selectionId: string;
		microversionId: string;
	};
	subsystemId: number;
	partName: string;
	machineId: number;
	stockId: number;
	quantity: number;
	cadMassLb: number;
};

export type PartRequestResponse =
	| { ok: true; requestId: string }
	| { ok: false; error: string };
