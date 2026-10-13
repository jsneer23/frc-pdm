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
import { MachineSelectionCard } from "../cards/MachineSelectionCard";
import { OnshapeSelectionCard } from "../cards/OnshapeSelectionCard";
import { PartDetailsCard } from "../cards/PartDetailsCard";
import {
	MACHINES,
	MATERIAL_THICKNESS,
	MATERIALS,
	type MaterialId,
	PART_TYPES,
} from "../constants";
import { QuantityField } from "../fields/QuantityField";
import { TextField } from "../fields/TextField";
import { ThicknessField } from "../fields/ThicknessField";
import { WeightField } from "../fields/WeightField";
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

const MACHINE_ITEMS = PART_TYPES.sheet.machines.map((id) => ({
	value: id,
	label: MACHINES[id].label,
	file_type: MACHINES[id].file_type,
}));

export function SheetForm() {
	const [machine, setMachine] = useState<SheetMachineId>(
		PART_TYPES.sheet.machines[0],
	);
	const [partName, setPartName] = useState("");
	const [subsystem, setSubsystem] = useState("");
	const [material, setMaterial] = useState<MaterialId | "">("");
	const [thickness, setThickness] = useState("");
	const [quantity, setQuantity] = useState("1");
	const [errors, setErrors] = useState<FormErrors>({});

	const machineDef = MACHINES[machine];
	const availableMaterials = machineDef.materials;
	const availableThicknesses = material
		? (MATERIAL_THICKNESS[material] ?? [])
		: [];
	const showThickness = machineDef.needsThickness;
	const thicknessRequired = availableThicknesses.length > 0;

	function handleMachineChange(next: SheetMachineId) {
		setMachine(next);

		// Clear the material if the new machine cannot use it.
		const materials: readonly MaterialId[] = MACHINES[next].materials;
		if (material !== "" && !materials.includes(material)) {
			setMaterial("");
			setThickness("");
			clearError("material", "thickness");
		}
		if (MACHINES[next].selection !== machineDef.selection) clear();
	}

	function handleMaterialChange(next: MaterialId | "") {
		setMaterial(next);
		setThickness("");
		clearError("material", "thickness");
	}

	function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		// Validation
		const nextErrors: FormErrors = {};
		const name = partName.trim();
		const subsystemName = subsystem.trim();
		const qty = Number(quantity);

		if (!selection) {
			nextErrors.selection =
				machineDef.selection === "face"
					? "Select a face in Onshape."
					: "Select a part in Onshape.";
		} else if (selection.weightLb == null) {
			nextErrors.weight = "No weight found. Set the part material in Onshape.";
		}

		if (name === "") nextErrors.partName = "Enter a part name.";
		if (subsystemName === "") nextErrors.subsystem = "Enter a part name.";
		if (material === "") nextErrors.material = "Select a material.";
		if (thicknessRequired && thickness === "")
			nextErrors.thickness = "Select a thickness.";
		if (!Number.isInteger(qty) || qty < 1)
			nextErrors.quantity = "Enter a valid quantity.";

		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		// The checks above make these impossible. This line tells TypeScript.
		if (!selection || material === "") return;

		// Request
		const request = {
			selection: {
				kind: selection.kind,
				entityId: selection.entityId,
				partId: selection.partId,
			},
			partName: name,
			machine,
			material,
			thickness: thicknessRequired ? Number(thickness) : null,
			quantity: qty,
			weightLb: selection.weightLb,
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
					? next.partName
					: prev,
			);
			lastOnshapeName.current = next.partName;
			clearError("selection", "partName", "weight");
		},
	});

	const weightText =
		selection?.weightLb != null ? `${selection.weightLb.toFixed(2)} lb` : "";

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
								items={MATERIALS}
								value={material}
								onValueChange={(value) => {
									if (value) handleMaterialChange(value as MaterialId);
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
									{availableMaterials.map((id) => (
										<SelectItem key={id} value={id}>
											{MATERIALS[id]}
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
						<WeightField value={weightText} error={errors.weight} />

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
