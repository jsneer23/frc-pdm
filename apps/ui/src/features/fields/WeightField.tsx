import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type WeightFieldProps = {
	value: string;
	error?: string;
};

export function WeightField({ value, error }: WeightFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor="weight">Estimated Weight (lbs)</FieldLabel>
			<Input id="weight" value={value} aria-invalid={!!error} readOnly />
			<FieldError>{error}</FieldError>
		</Field>
	);
}
