import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import type { SelectionType } from "../constants";
import type { OnshapeSelection } from "../onshape/useOnshapeSelection";
import { StepCard } from "./StepCard";
import { StepHeader } from "./StepHeader";

const SELECTION_TEXT = {
	face: {
		title: "Part Selection",
		description: "Choose a 2D face to export.",
		action: "Select face",
		waiting: "Click a planar face in Onshape…",
		label: "Face",
	},
	body: {
		title: "Part Selection",
		description: "Choose a 3D part to export.",
		action: "Select part",
		waiting: "Click a part in Onshape…",
		label: "Part",
	},
} satisfies Record<
	SelectionType,
	Record<"title" | "description" | "action" | "waiting" | "label", string>
>;

type SelectionCardProps = {
	kind: SelectionType;
	selection: OnshapeSelection | null;
	isSelecting: boolean;
	onStart: () => void;
	onCancel: () => void;
	step?: number;
	error?: string;
};

export function OnshapeSelectionCard({
	kind,
	selection,
	isSelecting,
	onStart,
	onCancel,
	step,
	error,
}: SelectionCardProps) {
	const text = SELECTION_TEXT[kind];

	return (
		<StepCard>
			<StepHeader
				step={step}
				title={text.title}
				description={text.description}
				actions={
					isSelecting ? (
						<Button type="button" variant="destructive" onClick={onCancel}>
							Cancel
						</Button>
					) : selection ? (
						<Badge
							variant="outline"
							className="h-9 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 border-primary/20 bg-primary/10 text-primary"
						>
							<CheckIcon aria-hidden="true" />
							Selected
						</Badge>
					) : (
						<Button
							type="button"
							variant="ghost"
							className="ml-auto"
							onClick={onStart}
						>
							{text.action}
						</Button>
					)
				}
			/>

			{isSelecting && (
				<p className="px-4 text-sm text-muted-foreground">{text.waiting}</p>
			)}

			{selection && (
				<Item variant="muted" size="sm" className="mx-2 mb-2">
					<ItemMedia className="rounded-md bg-foreground/10 px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
						{text.label}
					</ItemMedia>
					<ItemContent>
						<ItemTitle className="truncate">{selection.selectionId}</ItemTitle>
					</ItemContent>
					<ItemActions>
						<Button type="button" variant="ghost" size="sm" onClick={onStart}>
							Change
						</Button>
					</ItemActions>
				</Item>
			)}

			{error && <FieldError className="px-4 pb-2">{error}</FieldError>}
		</StepCard>
	);
}
