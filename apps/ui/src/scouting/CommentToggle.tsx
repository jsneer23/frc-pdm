import { cn } from "cn";
import { useState } from "react";
import { ToggleGroupItem } from "@/components/ui/toggle-group";

export const COMMENTS = [
	"Not on Field",
	"Stopped Moving",
	"Dead <45s",
	"Dead >45s",
	"Floor Pickup Algae",
	"Floor Pickup Coral",
	"Holds Both Game Pieces",
	"Slow Drive",
	"Fast Drive",
	"Bad Driving",
	"Good Driving",
	"Drops Game Pieces",
	"Lots of Fouls",
	"Tipped",
	"Didn't Move",
	"Broken",
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
				"h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm data-pressed:bg-primary data-pressed:text-white",
				!justClicked && "data-pressed:hover:bg-destructive",
			)}
		>
			{comment}
		</ToggleGroupItem>
	);
}
