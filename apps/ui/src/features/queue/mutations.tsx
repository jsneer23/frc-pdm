import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TablesUpdate } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export type PartChanges = TablesUpdate<"parts">;

async function updatePart({
	id,
	changes,
}: {
	id: number;
	changes: PartChanges;
}) {
	const { error } = await supabase.from("parts").update(changes).eq("id", id);
	if (error) {
		throw error;
	}
}

// one mutation for every card action: each sends the columns it changes, in
// one update, so the database checks see the finished row
export function useUpdatePart() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updatePart,
		// refetch the queue whether the update worked or not, so the card shows
		// what the database really holds
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: ["parts-queue"] }),
	});
}

// the database names the check that failed; map each name to what to do
const CHECK_MESSAGES: Record<string, string> = {
	parts_completed_requires_completer: "Pick who checked the part.",
	parts_completed_requires_mass: "Enter the weight first.",
	parts_completed_requires_full_count: "Mark every piece made first.",
	parts_completer_only_when_completed:
		"Clear who checked the part before reopening it.",
	parts_qty_made_range: "The made count must be between 0 and the quantity.",
};

export function partErrorMessage(error: Error): string {
	for (const [constraint, message] of Object.entries(CHECK_MESSAGES)) {
		if (error.message.includes(constraint)) {
			return message;
		}
	}
	// P5507 errors are written for already (i.e. "Pick who is changing the
	// status."); anything else gets a plain retry message
	if ("code" in error && error.code === "P5507") {
		return error.message;
	}
	return "Couldn't save the change. Try again.";
}
