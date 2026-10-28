import { FunctionsHttpError } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
	type MachineRow,
	machinesQueryOptions,
	type RobotRow,
	robotsQueryOptions,
} from "@/lib/queries";
import { supabase } from "@/lib/supabase";
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
		| "robot"
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

function toSelectItems(rows: { code: string; label: string }[]) {
	return rows.map((row) => ({ value: row.code, label: row.label }));
}

// select only machines used in the sheet form from the machine list fetched
// from the db
type SheetMachine = MachineRow & {
	selection: NonNullable<MachineRow["selection"]>;
};
type SheetMachineId = (typeof PART_TYPES.sheet.machines)[number];

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
		isPending: machinesPending,
		isError: machinesError,
	} = useQuery({ ...machinesQueryOptions, select: selectSheetMachines });

	const {
		data: robots,
		isPending: robotsPending,
		isError: robotsError,
	} = useQuery({ ...robotsQueryOptions });

	if (machinesPending || robotsPending) return <p>Loading…</p>;
	if (machinesError || robotsError) return <p>Couldn't load data.</p>;

	return <SheetFormFields machines={machines} robots={robots} />;
}

type SheetFormProps = {
	machines: Record<SheetMachineId, SheetMachine>;
	robots: RobotRow[];
};

function SheetFormFields({ machines, robots }: SheetFormProps) {
	const machineItems = PART_TYPES.sheet.machines.map((id) => ({
		value: id,
		label: machines[id].label,
		file_format: machines[id].file_format,
	}));

	const [machine, setMachine] = useState<SheetMachineId>(
		PART_TYPES.sheet.machines[0],
	);
	const [partName, setPartName] = useState("");
	const [robotCode, setRobotCode] = useState<string | null>(null);
	const [subsystem, setSubsystem] = useState<string | null>(null);
	const [material, setMaterial] = useState<string | null>(null);
	const [stockId, setStockId] = useState<number | null>(null);
	const [quantity, setQuantity] = useState("1");
	const [weightLb, setWeightLb] = useState<string>("");
	const [errors, setErrors] = useState<FormErrors>({});
	const lastSelectionId = useRef<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const robot = robots.find((r) => r.code === robotCode);
	const availableSubsystems = robot?.subsystems ?? [];
	const machineDef = machines[machine];
	const availableMaterials = machineDef.materials;
	const selectedMaterial = availableMaterials.find((m) => m.code === material);
	const availableStocks =
		selectedMaterial?.stocks
			.filter((s) => s.thickness_in !== null)
			.map((s) => ({
				value: s.id,
				label: String(s.thickness_in),
			})) ?? [];
	const disableThickness = availableStocks.length === 0;

	function handleRobotChange(next: string) {
		setRobotCode(next);
		setSubsystem(null);
		clearError("robot", "subsystem");
	}

	function handleMachineChange(next: SheetMachineId) {
		setMachine(next);
		resetPartDetails("");

		// clear onshape selection
		if (machines[next].selection !== machineDef.selection)
			clearOnshapeSelection();
	}

	function handleMaterialChange(next: string) {
		setStockId(null);
		setMaterial(next);
		clearError("material", "thickness");
	}

	function resetPartDetails(name: string) {
		setPartName(name);
		setMaterial(null);
		setStockId(null);
		setWeightLb("");
		setQuantity("1");
		clearError(
			"partName",
			"material",
			"thickness",
			"weight",
			"quantity",
			"subsystem",
		);
	}

	async function functionErrorMessage(error: unknown): Promise<string> {
		if (error instanceof FunctionsHttpError) {
			try {
				const body = await error.context.json();
				if (typeof body?.error === "string") return body.error;
			} catch {
				// The response wasn't JSON; fall through to the general message.
			}
			return "Something went wrong submitting the part.";
		}
		return "Couldn't reach the server. Check the queue before resubmitting.";
	}

	async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		const nextErrors: FormErrors = {};
		const trimmedName = partName.trim();
		const qty = Number(quantity);
		const weight = Number(weightLb);
		const subsystemId = availableSubsystems.find(
			(s) => s.code === subsystem,
		)?.id;
		const machineId = machines[machine].id;

		if (!selection) {
			nextErrors.selection =
				machineDef.selection === "face"
					? "Select a face in Onshape."
					: "Select a part in Onshape.";
		}

		if (robot === undefined) nextErrors.robot = "Select a robot.";
		if (trimmedName === "") nextErrors.partName = "Enter a part name.";
		if (subsystem === null || subsystemId === undefined) {
			nextErrors.subsystem = "Select a subsystem.";
		}
		if (material === null) nextErrors.material = "Select a material.";
		if (stockId === null) nextErrors.thickness = "Select a thickness.";
		if (!Number.isInteger(qty) || qty < 1)
			nextErrors.quantity = "Enter a valid quantity.";
		if (!(weight > 0 && weight <= 20)) {
			nextErrors.weight =
				"Enter valid weight. Ensure material is set and measure in Onshape.";
		}

		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		if (
			!selection ||
			material === null ||
			robot === undefined ||
			subsystemId === undefined ||
			stockId === null
		)
			return;

		// Request
		const request: PartRequest = {
			onshape: {
				userId: onshapeContext.userId,
				documentId: onshapeContext.documentId, // document
				workspaceId: onshapeContext.workspaceId, // branch
				elementId: onshapeContext.elementId, // tab
				kind: selection.entityType === "FACE" ? "face" : "body",
				selectionId: selection.selectionId,
				microversionId: selection.microversionId, // exact state of document in between each version. updates upon every edit
			},
			part: {
				partName: trimmedName,
				subsystemId,
				machineId,
				stockId,
				quantity: qty,
				cadMassLb: weight,
			},
		};

		console.log(request);
		setIsSubmitting(true);
		try {
			const { data, error } = await supabase.functions.invoke<{
				partId: number;
				partNumber: string;
				warning?: string;
			}>("onshape/export", {
				body: request,
			});
			if (error) {
				console.error(error);
				toast.error(await functionErrorMessage(error));
				return;
			}
			if (typeof data?.partNumber === "string") {
				toast.success(`Part ${data.partNumber} created`, {
					duration: 10000,
					action: {
						label: "Copy",
						onClick: () =>
							navigator.clipboard
								.writeText(data.partNumber)
								.then(() => toast.success("Copied"))
								.catch(() =>
									toast.error("Couldn't copy. Select the number and press ⌘C."),
								),
					},
				});
				if (data.warning) {
					toast.warning(data.warning);
				}
				resetPartDetails("");
				clearOnshapeSelection();
			}
			console.log(data);
		} finally {
			setIsSubmitting(false);
		}
	}

	function clearError(...fields: (keyof FormErrors)[]) {
		setErrors((prev) => {
			const next = { ...prev };
			for (const field of fields) next[field] = undefined;
			return next;
		});
	}

	const {
		selection,
		isSelecting,
		start,
		cancel,
		clear: clearOnshapeSelection,
	} = useOnshapeSelection({
		kind: machineDef.selection,
		onSelect: (next) => {
			if (next.selectionId !== lastSelectionId.current) {
				resetPartDetails(next.selectionId);
			}
			lastSelectionId.current = next.selectionId;
			clearError("selection", "partName", "weight");
		},
	});

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			<MachineSelectionCard
				step={1}
				options={machineItems}
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
			<PartDetailsCard
				step={3}
				actions={
					<Field>
						<Select
							value={robotCode}
							onValueChange={(value) => {
								if (value) handleRobotChange(value);
							}}
							items={toSelectItems(robots)}
						>
							<SelectTrigger
								aria-label="Robot"
								aria-invalid={!!errors.robot}
								className={cn(
									buttonVariants({ variant: "ghost", size: "sm" }),
									"w-auto bg-transparent data-placeholder:text-foreground",
									robotCode !== null &&
										"border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/20 aria-expanded:bg-primary/20 aria-expanded:text-primary",
								)}
							>
								<SelectValue placeholder="Select Robot" />
							</SelectTrigger>
							<SelectContent>
								{robots.map((robot) => (
									<SelectItem key={robot.id} value={robot.code}>
										{robot.code}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FieldError>{errors.robot}</FieldError>
					</Field>
				}
			>
				<FieldGroup className="gap-6 px-4 pb-4">
					<div className="grid grid-cols-2 items-start gap-4">
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
						<Field>
							<FieldLabel htmlFor="subsystem">Subsystem</FieldLabel>
							<Select
								value={subsystem}
								disabled={robot === undefined}
								onValueChange={(value) => {
									setSubsystem(value);
									clearError("subsystem");
								}}
								items={toSelectItems(availableSubsystems)}
							>
								<SelectTrigger
									id="subsystem"
									className="w-full"
									aria-invalid={!!errors.subsystem}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{availableSubsystems.map((subsystem) => (
										<SelectItem key={subsystem.id} value={subsystem.code}>
											{subsystem.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldError>{errors.subsystem}</FieldError>
						</Field>
					</div>
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

						<ThicknessField
							items={availableStocks}
							disabled={disableThickness}
							value={stockId}
							onChange={(value) => {
								setStockId(value);
								clearError("thickness");
							}}
							error={errors.thickness}
						/>
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
				</FieldGroup>
			</PartDetailsCard>
			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting && (
					<Loader2Icon data-icon="inline-start" className="animate-spin" />
				)}
				{isSubmitting ? "Submitting…" : "Submit Request"}
			</Button>
		</form>
	);
}
