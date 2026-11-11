import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps = {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	placeholder?: string;
};

export function TextField({
	id,
	label,
	value,
	onChange,
	error,
	placeholder,
}: TextFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Input
				id={id}
				type="text"
				value={value}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
				aria-invalid={!!error}
			/>
			<FieldError>{error}</FieldError>
		</Field>
	);
}
