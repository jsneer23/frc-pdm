export const MACHINES = {
	saw: {
		label: "Chop Saw",
		file_type: "dwg",
		materials: [
			"tube_2x1_7075",
			"tube_2x1_punched",
			"tube_2x1_blank",
			"tube_1x1_punched",
			"tube_1x1_blank",
			"maxtube_2x1",
			"maxtube_1x1",
			"alu_maxspline",
			"poly_maxspline",
		],
		needsThickness: true,
	},
	co2_laser: {
		label: "CO2 Laser",
		file_type: "dxf",
		materials: ["srpp", "polycarbonate", "wood"],
		needsThickness: true,
		selection: "ENTITY",
	},
	router: {
		label: "Router",
		file_type: "step",
		materials: ["srpp", "polycarbonate", "wood", "al6061", "al7075", "al5052"],
		needsThickness: true,
		selection: "BODY",
	},
	printer: {
		label: "3D Printer",
		file_type: "step",
		materials: ["tpu", "petg", "pla", "nylon", "onyx"],
		needsThickness: false,
		selection: "BODY",
	},
	lathe: {
		label: "Lathe",
		file_type: "dwg",
		materials: ["hex_0500_159"],
		needsThickness: false,
	},
} as const satisfies Record<string, MachineDef>;

export type SelectionType = "ENTITY" | "BODY";
export type EntityType = "FACE" | "undefined";

type MachineDef = {
	label: string;
	file_type: string;
	materials: readonly string[];
	needsThickness: boolean;
	selection?: SelectionType;
};

export type MachineId = keyof typeof MACHINES;
export type MaterialId = (typeof MACHINES)[MachineId]["materials"][number];

export const MATERIAL_THICKNESS: Partial<
	Record<MaterialId, readonly number[]>
> = {
	srpp: [0.25],
	polycarbonate: [0.118, 0.196, 0.236],
	wood: [], // TODO: measue
	al6061: [0.125, 0.1875, 0.25],
	al7075: [], // TODO: measue
	al5052: [], // TODO: measue
	tube_2x1_7075: [0.0625],
	tube_2x1_punched: [0.0625, 0.09375, 0.125],
	tube_2x1_blank: [0.0625, 0.125],
	tube_1x1_punched: [0.0625, 0.125],
	tube_1x1_blank: [0.0625, 0.125],
	maxtube_2x1: [0.04, 0.125],
	maxtube_1x1: [0.04, 0.125],
};

type ProcessDef = {
	label: string;
	description: string;
	machines: readonly MachineId[];
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
	partName: string;
	machine: MachineId;
	material: MaterialId;
	thickness: number | null;
	quantity: number;
	weightLb: number;
};

export type PartRequestResponse =
	| { ok: true; requestId: string }
	| { ok: false; error: string };
