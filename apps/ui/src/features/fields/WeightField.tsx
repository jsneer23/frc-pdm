import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type WeightFieldProps = {
	value: string;
	onChange: (value: string) => void;
	error?: string;
};

export function WeightField({ value, onChange, error }: WeightFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor="weight">Estimated Weight (lbs)</FieldLabel>
			<Input
				id="weight"
				type="number"
				min="0"
				max="20"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				aria-invalid={!!error}
			/>
			<FieldError>{error}</FieldError>
		</Field>
	);
}
