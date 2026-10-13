import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type ThicknessFieldProps = {
	options: readonly number[];
	disabled?: boolean;
	value: string;
	onChange: (value: string) => void;
	error?: string;
};

export function ThicknessField({
	options,
	disabled,
	value,
	onChange,
	error,
}: ThicknessFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor="thickness">Thickness (in)</FieldLabel>
			<Select
				value={value}
				onValueChange={(next) => onChange(next ?? "")}
				disabled={disabled}
			>
				<SelectTrigger id="thickness" className="w-full" aria-invalid={!!error}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((t) => (
						<SelectItem key={t} value={String(t)}>
							{t}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<FieldError>{error}</FieldError>
		</Field>
	);
}
