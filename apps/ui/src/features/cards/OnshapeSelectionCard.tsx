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
import type { SelectionKind } from "../constants";
import type { OnshapeSelection } from "../onshape/useOnshapeSelection";
import { StepHeader } from "./StepHeader";

const SELECTION_TEXT = {
	face: {
		title: "Select a planar face",
		description: "Choose the face to export for 2D machining.",
		action: "Select face",
		waiting: "Click a planar face in Onshape…",
		label: "Face",
	},
	part: {
		title: "Select a part",
		description: "Choose the part to export for 3D machining.",
		action: "Select part",
		waiting: "Click a part in Onshape…",
		label: "Part",
	},
} satisfies Record<
	SelectionKind,
	Record<"title" | "description" | "action" | "waiting" | "label", string>
>;

type SelectionCardProps = {
	kind: SelectionKind;
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
		<div className="flex flex-col gap-2 rounded-lg border p-2">
			<StepHeader
				step={step}
				title={text.title}
				description={text.description}
				actions={
					isSelecting ? (
						<Button type="button" variant="ghost" size="sm" onClick={onCancel}>
							Cancel
						</Button>
					) : selection ? (
						<Badge
							variant="outline"
							className="h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 border-primary/20 bg-primary/10 text-primary"
						>
							<CheckIcon aria-hidden="true" />
							Selected
						</Badge>
					) : (
						<Button type="button" variant="outline" size="sm" onClick={onStart}>
							{text.action}
						</Button>
					)
				}
			/>

			{isSelecting && (
				<p className="px-4 text-sm text-muted-foreground">{text.waiting}</p>
			)}

			{selection && (
				<Item variant="muted" size="sm">
					<ItemMedia className="text-xs font-semibold uppercase text-muted-foreground">
						{text.label}
					</ItemMedia>
					<ItemContent>
						<ItemTitle className="truncate">{selection.partName}</ItemTitle>
					</ItemContent>
					<ItemActions>
						<Button type="button" variant="ghost" size="sm" onClick={onStart}>
							Change
						</Button>
					</ItemActions>
				</Item>
			)}

			{error && <FieldError className="px-4">{error}</FieldError>}
		</div>
	);
}
