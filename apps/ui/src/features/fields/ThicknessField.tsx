import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type ThicknessFieldProps = {
	items: {
		value: number;
		label: string;
	}[];
	disabled?: boolean;
	value: number | null;
	onChange: (value: number | null) => void;
	error?: string;
};

export function ThicknessField({
	items,
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
				onValueChange={(next) => onChange(next)}
				disabled={disabled}
				items={items}
			>
				<SelectTrigger id="thickness" className="w-full" aria-invalid={!!error}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{items.map((t) => (
						<SelectItem key={t.value} value={t.value}>
							{t.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<FieldError>{error}</FieldError>
		</Field>
	);
}
