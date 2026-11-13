import { supabase } from "@/lib/supabase";
import type { QueuePart } from "./queries";

// long enough to start the download, short enough that a copied link is
// soon useless
const LINK_SECONDS = 60;

// a link to the part's exported file that works for a minute. members may
// read the private part-files bucket, so Supabase checks that when it creates
// the link. "download" names the saved file and tells the browser to save it
// rather than open it.
export async function partFileUrl(part: QueuePart): Promise<string> {
	if (part.export_status !== "done" || part.export_file_path === null) {
		throw new Error("This part has no file yet.");
	}
	const { data, error } = await supabase.storage
		.from("part-files")
		.createSignedUrl(part.export_file_path, LINK_SECONDS, {
			download: `${part.part_number}.${part.export_file_format}.zip`,
		});
	if (error) {
		throw error;
	}
	return data.signedUrl;
}
