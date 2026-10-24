import { Flag, Skull, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { HoldButton } from "./HoldButton";

type DeleteAllSavedProps = {
	count: number;
	onDelete: () => void;
};

export function ClearCache({ count, onDelete }: DeleteAllSavedProps) {
	const [open, setOpen] = useState(false);

	const label = count === 1 ? "1 saved match" : `${count} saved matches`;

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger render={<Button variant="destructive" />}>
				<Trash2 />
				Delete all saved matches
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex w-full items-center justify-center gap-2">
						<Skull className="size-5 shrink-0" /> DANGER
						<Skull className="size-5 shrink-0" />
					</AlertDialogTitle>
					<AlertDialogDescription className="text-center">
						Arrr... There's danger afoot. This permanently deletes every saved
						QR code from this device. It can't be undone. Make sure each match
						has been scanned into the spreadsheet before you continue.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						{" "}
						<Flag />
						Return to safety
					</AlertDialogCancel>
					<HoldButton
						variant="destructive"
						idleLabel={`Hold to delete ${label}`}
						doneLabel="Deleted"
						onComplete={() => {
							onDelete();
							setOpen(false);
						}}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
