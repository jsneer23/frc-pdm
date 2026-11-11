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
