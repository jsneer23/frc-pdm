export const MATERIALS = {
	srpp: "SRPP",
	polycarbonate: "Polycarbonate",
	wood: "Plywood",
	al6061: "Aluminum 6061",
	al7075: "Aluminum 7075",
	al5052: "Aluminum 5052",
	tpu: "TPU (95A)",
	petg: "PETG",
	pla: "PLA+",
	nylon: "NYLON",
	onyx: "Onyx (Markforged Only)",
	tube_2x1_7075: "2x1 7075 (black)",
	tube_2x1_punched: "2x1 Punched",
	tube_2x1_blank: "2x1 Blank",
	tube_1x1_punched: "1x1 Punched",
	tube_1x1_blank: "1x1 Blank",
	maxtube_2x1: "2x1 Maxtube",
	maxtube_1x1: "1x1 Maxtube",
	alu_maxspline: "Maxspline",
	poly_maxspline: "Polycarbonate Maxspline",
	hex_0500_159: '1/2" Hex (WCP)',
} as const;

export type MaterialId = keyof typeof MATERIALS;

export const MACHINES = {
	saw: {
		label: "Chop Saw",
		file_type: "DWG",
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
		file_type: "DXF",
		materials: ["srpp", "polycarbonate", "wood"],
		needsThickness: true,
		selection: "face",
	},
	router: {
		label: "Router",
		file_type: "STEP",
		materials: ["srpp", "polycarbonate", "wood", "al6061", "al7075", "al5052"],
		needsThickness: true,
		selection: "part",
	},
	printer: {
		label: "3D Printer",
		file_type: "STEP",
		materials: ["tpu", "petg", "pla", "nylon", "onyx"],
		needsThickness: false,
		selection: "part",
	},
	lathe: {
		label: "Lathe",
		file_type: "DWG",
		materials: ["hex_0500_159"],
		needsThickness: false,
	},
} as const satisfies Record<string, MachineDef>;

export type SelectionRequest = "face" | "part";
export type SelectionType = "ENTITY" | "BODY";
export type EntityType = "FACE" | "undefined";

type MachineDef = {
	label: string;
	file_type: string;
	materials: readonly MaterialId[];
	needsThickness: boolean;
	selection?: SelectionRequest;
};

export type MachineId = keyof typeof MACHINES;

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
