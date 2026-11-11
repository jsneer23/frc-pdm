import { StepCard } from "../../../components/layout/StepCard";
import { StepHeader } from "../../../components/layout/StepHeader";

type PartDetailsCardProps = {
	step?: number;
	actions?: React.ReactNode;
	children: React.ReactNode;
};

export function PartDetailsCard({
	step,
	actions,
	children,
}: PartDetailsCardProps) {
	return (
		<StepCard>
			<StepHeader
				step={step}
				title="Part details"
				description="Pick a robot and enter details."
				actions={actions}
			/>
			{children}
		</StepCard>
	);
}
