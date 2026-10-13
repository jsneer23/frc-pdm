import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";

type StepHeaderProps = {
	title: string;
	description?: string;
	step?: number;
	actions?: React.ReactNode;
};

export function StepHeader({
	title,
	description,
	step,
	actions,
}: StepHeaderProps) {
	return (
		<Item>
			{step !== undefined && (
				<ItemMedia className="size-10 rounded-full bg-primary/5 text-md font-medium text-primary">
					{step}
				</ItemMedia>
			)}
			<ItemContent>
				<ItemTitle>{title}</ItemTitle>
				{description && <ItemDescription>{description}</ItemDescription>}
			</ItemContent>
			{actions && <ItemActions aria-live="polite">{actions}</ItemActions>}
		</Item>
	);
}
