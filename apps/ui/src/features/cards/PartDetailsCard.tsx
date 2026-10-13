import { FieldGroup } from "@/components/ui/field";
import { StepHeader } from "./StepHeader";

type PartDetailsCardProps = {
	step?: number;
	children: React.ReactNode;
};

export function PartDetailsCard({ step, children }: PartDetailsCardProps) {
	return (
		<div className="flex flex-col gap-2 rounded-lg border p-2">
			<StepHeader
				step={step}
				title="Part details"
				description="Check the name, material, and quantity."
			/>
			<FieldGroup className="px-4 pb-4">{children}</FieldGroup>
		</div>
	);
}
