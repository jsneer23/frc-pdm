import { useState } from "react";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export const COMMENTS = [
	"Stopped Moving",
	"Dead <45s",
	"Dead >45s",
	"Floor Pickup Algae",
	"Floor Pickup Coral",
	"Holds Both Game Pieces",
	"Slow Drive",
	"Fast Drive",
	"Good Driving",
	"Bad Driving",
	"Drops Game Pieces",
	"Lots of Fouls",
	"Tipped",
	"Didn't Move",
	"Broken",
	"Did Not Show Up",
	"Played Defense",
	"Received Defense",
	"Yellow Card",
];

export function CommentToggle({ comment }: { comment: string }) {
	const [justClicked, setJustClicked] = useState(false);

	return (
		<ToggleGroupItem
			value={comment}
			onClick={() => setJustClicked(true)}
			onPointerLeave={() => setJustClicked(false)}
			className={cn(
				"data-pressed:bg-primary data-pressed:text-white",
				!justClicked && "data-pressed:hover:bg-destructive",
			)}
		>
			{comment}
		</ToggleGroupItem>
	);
}
