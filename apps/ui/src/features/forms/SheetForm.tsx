import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type MachineRow, machinesQueryOptions } from "@/lib/queries";
import { MachineSelectionCard } from "../cards/MachineSelectionCard";
import { OnshapeSelectionCard } from "../cards/OnshapeSelectionCard";
import { PartDetailsCard } from "../cards/PartDetailsCard";
import { PART_TYPES, type PartRequest } from "../constants";
import { QuantityField } from "../fields/QuantityField";
import { TextField } from "../fields/TextField";
import { ThicknessField } from "../fields/ThicknessField";
import { WeightField } from "../fields/WeightField";
import { onshapeContext } from "../onshape/onshapeClient";
import { useOnshapeSelection } from "../onshape/useOnshapeSelection";

type FormErrors = Partial<
	Record<
		| "partName"
		| "material"
		| "thickness"
		| "quantity"
		| "selection"
		| "weight"
		| "subsystem",
		string
	>
>;

type SheetMachineId = (typeof PART_TYPES.sheet.machines)[number];

// exchange codes for labels for use in select components
// defined outside component so it only runs once per
// db fetch and not once per render
function toSelectItems(rows: { code: string; label: string }[]) {
	return rows.map((row) => ({ value: row.code, label: row.label }));
}

// select only machines used in the sheet form from the machine list fetched
// from the db
type SheetMachine = MachineRow & {
	selection: NonNullable<MachineRow["selection"]>;
};

function selectSheetMachines(rows: MachineRow[]) {
	const result = {} as Record<SheetMachineId, SheetMachine>;
	for (const code of PART_TYPES.sheet.machines) {
		const row = rows.find((r) => r.code === code);
		if (!row)
			throw new Error(`Machine "${code}" is missing from the database.`);
		if (row.selection === null)
			throw new Error(`Machine "${code}" has no Onshape selection type.`);
		result[code] = { ...row, selection: row.selection };
	}
	return result;
}

export function SheetForm() {
	const {
		data: machines,
		isPending,
		isError,
	} = useQuery({ ...machinesQueryOptions, select: selectSheetMachines });

	if (isPending) return <p>Loading machines…</p>;
	if (isError) return <p>Couldn't load machines.</p>;

	return <SheetFormFields machines={machines} />;
}

function SheetFormFields({
	machines,
}: {
	machines: Record<SheetMachineId, SheetMachine>;
}) {
	const MACHINE_ITEMS = PART_TYPES.sheet.machines.map((id) => ({
		value: id,
		label: machines[id].label,
		file_format: machines[id].file_format,
	}));

	const [machine, setMachine] = useState<SheetMachineId>(
		PART_TYPES.sheet.machines[0],
	);
	const [partName, setPartName] = useState("");
	const [subsystem, setSubsystem] = useState("");
	const [material, setMaterial] = useState("");
	const [thickness, setThickness] = useState("");
	const [quantity, setQuantity] = useState("1");
	const [weightLb, setWeightLb] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});

	const machineDef = machines[machine];
	const availableMaterials = machineDef.materials;
	const selectedMaterial = availableMaterials.find((m) => m.code === material);
	const availableThicknesses =
		selectedMaterial?.stocks
			.map((s) => s.thickness_in)
			.filter((t): t is number => t !== null) ?? [];
	const showThickness = availableThicknesses.length > 0;

	function handleMachineChange(next: SheetMachineId) {
		setMachine(next);

		// Clear the material if the new machine cannot use it.
		const materials = machines[next].materials;
		if (material !== "" && !materials.some((m) => m.code === material)) {
			setMaterial("");
			setThickness("");
			clearError("material", "thickness");
		}
		if (machines[next].selection !== machineDef.selection) clear();
	}

	function handleMaterialChange(next: string) {
		setMaterial(next);
		setThickness("");
		clearError("material", "thickness");
	}

	function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		const nextErrors: FormErrors = {};
		const name = partName.trim();
		const subsystemName = subsystem.trim();
		const qty = Number(quantity);
		const weight = Number(weightLb);

		if (!selection) {
			nextErrors.selection =
				machineDef.selection === "face"
					? "Select a face in Onshape."
					: "Select a part in Onshape.";
		}

		if (name === "") nextErrors.partName = "Enter a part name.";
		if (subsystemName === "") nextErrors.subsystem = "Enter a subsystem name.";
		if (material === "") nextErrors.material = "Select a material.";
		if (showThickness && thickness === "")
			nextErrors.thickness = "Select a thickness.";
		if (!Number.isInteger(qty) || qty < 1)
			nextErrors.quantity = "Enter a valid quantity.";
		if (!(weight > 0 && weight <= 20)) {
			nextErrors.weight =
				"Enter valid weight. Ensure material is set and measure in Onshape.";
		}

		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		if (!selection || material === "") return;

		// Request
		const request: PartRequest = {
			document: {
				userId: onshapeContext.userId,
				documentId: onshapeContext.documentId,
				workspaceId: onshapeContext.workspaceId,
				elementId: onshapeContext.elementId,
			},
			selection: {
				kind: selection.entityType === "FACE" ? "face" : "body",
				selectionId: selection.selectionId,
				microversionId: selection.microversionId,
			},
			partName: name,
			machine,
			material,
			thickness: showThickness ? Number(thickness) : null,
			quantity: qty,
			weightLb: weight,
		};

		console.log(request);
	}

	function clearError(...fields: (keyof FormErrors)[]) {
		setErrors((prev) => {
			const next = { ...prev };
			for (const field of fields) next[field] = undefined;
			return next;
		});
	}

	const lastOnshapeName = useRef("");

	const { selection, isSelecting, start, cancel, clear } = useOnshapeSelection({
		kind: machineDef.selection,
		onSelect: (next) => {
			// fill the name only if the user did not change it.
			setPartName((prev) =>
				prev.trim() === "" || prev === lastOnshapeName.current
					? next.selectionId
					: prev,
			);
			lastOnshapeName.current = next.selectionId;
			clearError("selection", "partName", "weight");
		},
	});

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
			<MachineSelectionCard
				step={1}
				options={MACHINE_ITEMS}
				value={machine}
				onChange={handleMachineChange}
			/>
			<OnshapeSelectionCard
				step={2}
				kind={machineDef.selection}
				selection={selection}
				isSelecting={isSelecting}
				onStart={start}
				onCancel={cancel}
				error={errors.selection}
			/>
			<FieldGroup>
				<PartDetailsCard step={3}>
					<TextField
						id="partName"
						label="Part Name"
						value={partName}
						onChange={(value) => {
							setPartName(value);
							clearError("partName");
						}}
						error={errors.partName}
					/>
					<div className="grid grid-cols-2 items-start gap-4">
						<Field>
							<FieldLabel htmlFor="material">Material</FieldLabel>
							<Select
								items={toSelectItems(availableMaterials)}
								value={material}
								onValueChange={(value) => {
									if (value) handleMaterialChange(value);
								}}
							>
								<SelectTrigger
									id="material"
									className="w-full"
									aria-invalid={!!errors.material}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{availableMaterials.map((material) => (
										<SelectItem key={material.code} value={material.code}>
											{material.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldError>{errors.material}</FieldError>
						</Field>

						{showThickness && (
							<ThicknessField
								options={availableThicknesses}
								disabled={availableThicknesses.length === 0}
								value={thickness}
								onChange={(value) => {
									setThickness(value);
									clearError("thickness");
								}}
								error={errors.thickness}
							/>
						)}
					</div>
					<div className="grid grid-cols-2 items-start gap-4">
						<WeightField
							value={weightLb}
							onChange={(value) => {
								setWeightLb(value);
								clearError("weight");
							}}
							error={errors.weight}
						/>

						<QuantityField
							value={quantity}
							onChange={(value) => {
								setQuantity(value);
								clearError("quantity");
							}}
							error={errors.quantity}
						/>
					</div>
					<TextField
						id="subsystem"
						label="Subsystem"
						value={subsystem}
						onChange={(value) => {
							setSubsystem(value);
							clearError("subsystem");
						}}
						error={errors.subsystem}
					/>
				</PartDetailsCard>
			</FieldGroup>
			<CardFooter>
				<Button type="submit" className="w-full">
					Submit Request
				</Button>
			</CardFooter>
		</form>
	);
}
