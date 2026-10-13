import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepHeader } from "./StepHeader";

type MachineOption<T extends string> = {
	value: T;
	label: string;
	file_type: string;
};

type MachineCardProps<T extends string> = {
	options: readonly MachineOption<T>[];
	value: T;
	onChange: (value: T) => void;
	step?: number;
};

export function MachineSelectionCard<T extends string>({
	options,
	value,
	onChange,
	step,
}: MachineCardProps<T>) {
	return (
		<FieldSet className="flex flex-col gap-2 rounded-lg border p-2">
			<FieldLegend className="sr-only">Machine</FieldLegend>

			<StepHeader
				step={step}
				title="Select a machine"
				description="Choose the machine that makes this part."
			/>

			<RadioGroup
				value={value}
				onValueChange={(next) => onChange(next as T)}
				className="grid grid-cols-2 gap-3 px-2 pb-2"
			>
				{options.map((option) => (
					<FieldLabel
						key={option.value}
						htmlFor={`machine-${option.value}`}
						className="has-data-checked:border-primary has-data-checked:bg-primary/5 has-focus-visible:ring-2"
					>
						<Field orientation="horizontal">
							<FieldContent>
								<FieldTitle>{option.label}</FieldTitle>
								{option.file_type && (
									<FieldDescription>{option.file_type}</FieldDescription>
								)}
							</FieldContent>
							<RadioGroupItem
								value={option.value}
								id={`machine-${option.value}`}
								className="sr-only"
							/>
						</Field>
					</FieldLabel>
				))}
			</RadioGroup>
		</FieldSet>
	);
}
