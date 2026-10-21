import { StepCard } from "./StepCard";
import { StepHeader } from "./StepHeader";

type PartDetailsCardProps = {
	step?: number;
	children: React.ReactNode;
};

export function PartDetailsCard({ step, children }: PartDetailsCardProps) {
	return (
		<StepCard>
			<StepHeader
				step={step}
				title="Part details"
				description="Check the name, material, and quantity."
			/>
			{children}
		</StepCard>
	);
}
