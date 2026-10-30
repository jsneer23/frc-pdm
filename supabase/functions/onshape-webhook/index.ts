import "@supabase/functions-js/edge-runtime.d.ts";
import { type SupabaseContext, withSupabase } from "@supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../_shared/database.types.ts";
import {
	downloadExternalData,
	getTranslationInfo,
} from "../_shared/onshapeApi.ts";
import { verifyOnshapeSignature } from "../_shared/onshapeWebhook.ts";
import { isObject } from "../_shared/validators.ts";

const BUCKET = "part-files";

export default {
	fetch: withSupabase({ auth: "none", cors: false }, async (req, ctx) => {
		if (req.method !== "POST") {
			return new Response(null, { status: 405 });
		}

		// verify the exact text Onshape signed, before parsing it
		const rawBody = await req.text();
		if (!(await verifyOnshapeSignature(req.headers, rawBody))) {
			console.warn("Rejected webhook: bad or missing signature");
			return new Response(null, { status: 401 });
		}

		let event: unknown;
		try {
			event = JSON.parse(rawBody);
		} catch {
			console.error("Signed webhook body wasn't JSON:", rawBody);
			return ok();
		}
		if (
			!isObject(event) ||
			event.event !== "onshape.model.translation.complete"
		) {
			console.log("Webhook ignored:", isObject(event) ? event.event : event);
			return ok();
		}
		if (typeof event.translationId !== "string") {
			console.error("translation.complete without a translationId:", event);
			return ok();
		}

		try {
			await handleTranslationComplete(ctx, event.translationId);
		} catch (err) {
			console.error("Webhook handler crashed:", err);
		}
		return ok();
	}),
};

function ok(): Response {
	return new Response(null, { status: 200 });
}

async function handleTranslationComplete(
	ctx: SupabaseContext,
	translationId: string,
): Promise<void> {
	const admin = ctx.supabaseAdmin as SupabaseClient<Database>;
	const { data: row, error } = await admin
		.from("part_exports")
		.select("id, part_id, document_id, status")
		.eq("translation_id", translationId)
		.maybeSingle();

	if (error) {
		console.error("Export row lookup failed:", error);
		return;
	}
	// webhook covers the whole classroom account. some translations aren't for the app
	if (row === null) return;
	// already handled. duplicate notification
	if (row.status !== "exporting") return;

	const info = await getTranslationInfo(translationId);
	if (typeof info === "string") return markFailed(ctx, row.id, info);

	const file = await downloadExternalData(row.document_id, info.externalDataId);
	if (typeof file === "string") return markFailed(ctx, row.id, file);

	const { data: part, error: numberError } = await admin
		.from("parts_with_number")
		.select("part_number")
		.eq("id", row.part_id)
		.single();
	if (numberError || part.part_number === null) {
		return markFailed(ctx, row.id, "Couldn't read the part number.");
	}

	// Exports are always STEP for now, whatever the machine's file_format.
	const path = `${row.id}/${part.part_number}.step`;
	const { error: uploadError } = await admin.storage
		.from(BUCKET)
		.upload(path, file.bytes, { contentType: "model/step", upsert: true });
	if (uploadError) {
		return markFailed(ctx, row.id, `Upload failed: ${uploadError.message}`);
	}

	const { error: doneError } = await admin
		.from("part_exports")
		.update({ status: "done", file_path: path })
		.eq("id", row.id)
		.eq("status", "exporting");
	if (doneError) console.error("Marking export done failed:", doneError);
}

async function markFailed(
	ctx: SupabaseContext,
	id: number,
	reason: string,
): Promise<void> {
	console.error(`Export ${id} failed:`, reason);
	const admin = ctx.supabaseAdmin as SupabaseClient<Database>;
	const { error } = await admin
		.from("part_exports")
		.update({ status: "failed", failure_reason: reason })
		.eq("id", id)
		.eq("status", "exporting"); // never set a success status to failed
	if (error) console.error("Could not mark export failed in database:", error);
}
