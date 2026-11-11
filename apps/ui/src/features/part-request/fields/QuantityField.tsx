import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type QuantityFieldProps = {
	value: string;
	onChange: (value: string) => void;
	error?: string;
};

export function QuantityField({ value, onChange, error }: QuantityFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor="quantity">Quantity</FieldLabel>
			<Input
				id="quantity"
				type="number"
				min="1"
				step="1"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				aria-invalid={!!error}
			/>
			<FieldError>{error}</FieldError>
		</Field>
	);
}
