import { type SupabaseContext, withSupabase } from "@supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "../_shared/database.types.ts";
import { startStepExport } from "../_shared/onshapeApi.ts";
import {
	isNonEmptyString,
	isObject,
	isOccurrencePath,
	isOnshapeId,
	isPositiveInteger,
	isUuid,
	isVisibleAscii,
} from "../_shared/validators.ts";

type Db = SupabaseClient<Database>;

// part attributes stored in parts db table
type PartInsert = Pick<
	TablesInsert<"parts">,
	| "request_id"
	| "subsystem_id"
	| "stock_id"
	| "machine_id"
	| "qty"
	| "name"
	| "cad_mass_g"
>;

// narrow PartInsert type to require request_id. the db table allows
// null request_ids, but every panel request must carry one
type ValidatedPart = PartInsert & { request_id: string };

// onshape attributes stored in part_exports db table
type OnshapeFields = Pick<
	TablesInsert<"part_exports">,
	| "document_id"
	| "workspace_id"
	| "element_id"
	| "selection_id"
	| "microversion_id"
	| "kind"
	| "occurrence_path"
>;

// onshape users work in lbs but our scale is in grams
const GRAMS_PER_POUND = 453.59237;

export default {
	fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
		const path = new URL(req.url).pathname;

		if (req.method === "POST" && path.endsWith("/export")) {
			return await handleExport(req, ctx);
		}

		return Response.json({ error: "Not found" }, { status: 404 });
	}),
};

async function handleExport(
	req: Request,
	ctx: SupabaseContext,
): Promise<Response> {
	const db = ctx.supabase as SupabaseClient<Database>;
	const admin = ctx.supabaseAdmin as SupabaseClient<Database>;

	const userId = ctx.userClaims?.id;
	if (!userId) {
		return Response.json({ error: "Not signed in" }, { status: 401 });
	}

	// ctx.supabase acts as the caller, so RLS applies. members is readable only
	// by members, so a non-member gets no row back.
	const { data: member, error: memberError } = await db
		.from("members")
		.select("id")
		.eq("auth_user_id", userId)
		.maybeSingle();

	if (memberError) {
		console.error("Member lookup failed:", memberError);
		return Response.json(
			{ error: "Could not check membership" },
			{ status: 500 },
		);
	}
	if (member === null) {
		return Response.json({ error: "Not a team member" }, { status: 403 });
	}

	// read and check the request body
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return Response.json(
			{ error: "Request body must be JSON." },
			{ status: 400 },
		);
	}

	const parsed = parseExportRequest(body);
	if (typeof parsed === "string") {
		return Response.json({ error: parsed }, { status: 400 });
	}

	// insert part as the caller and get id of the insert
	const { data: part, error: insertError } = await db
		.from("parts")
		.insert(parsed.part)
		.select("id, machines(file_format)")
		.single();

	if (insertError) {
		// duplicate submission, either via a double click, or a retry after a
		// lost response. error code and message proves the part exists
		// so json response is a 2xx with the existing part instead of creating
		// a second one or erroring.
		// TODO(T24): if that part's export never started, decide whether to
		// start it here.
		if (
			insertError.code === "23505" &&
			insertError.message.includes("parts_request_id_key")
		) {
			const existing = await readPartNumber(db, {
				request_id: parsed.part.request_id,
			});
			return partResponse(
				existing?.id ?? null,
				existing?.part_number ?? null,
				200,
			);
		}
		return insertErrorResponse(insertError);
	}

	// read assigned part number from db
	const numbered = await readPartNumber(db, { id: part.id });
	const partNumber = numbered?.part_number ?? null;
	if (partNumber === null) {
		return partResponse(part.id, null, 201);
	}

	// only step exports work right now. do not make onshape call for any other format
	const fileFormat = part.machines.file_format;
	const isSupported = fileFormat === "step";

	// start the export before writing part_exports, so the row is written
	// once: with its translation ID, or with the reason the export didn't start.
	const started = isSupported
		? await startStepExport({
				documentId: parsed.onshape.document_id,
				workspaceId: parsed.onshape.workspace_id,
				elementId: parsed.onshape.element_id,
				occurrencePath: parsed.onshape.occurrence_path,
			})
		: `${fileFormat.toUpperCase()} export isn't supported yet.`;

	if (isSupported && typeof started === "string") {
		console.error("Onshape export didn't start:", started);
	}

	const exportResult =
		typeof started === "string"
			? { status: "failed" as const, failure_reason: started }
			: { translation_id: started.translationId };

	// part_exports is server-only, so write it with the admin client.
	// file_format is copied from the machine now, so later machine edits don't change this export.
	const { error: exportError } = await admin.from("part_exports").insert({
		...parsed.onshape,
		...exportResult,
		part_id: part.id,
		file_format: part.machines.file_format,
	});

	if (exportError) {
		console.error("Export row insert failed:", exportError);
		return partResponse(
			part.id,
			partNumber,
			201,
			"The part was created, but its Onshape details weren't saved.",
		);
	}
	if (typeof started === "string") {
		return partResponse(
			part.id,
			partNumber,
			201,
			isSupported
				? "The part was created, but its file export didn't start."
				: `Part created. ${fileFormat.toUpperCase()} export isn't supported yet. Export manually.`,
		);
	}
	return partResponse(part.id, partNumber, 201);
}

async function readPartNumber(
	db: Db,
	match: { id: number } | { request_id: string },
) {
	const { data, error } = await db
		.from("parts_with_number")
		.select("id, part_number")
		.match(match)
		.maybeSingle();
	if (error) {
		console.error("Part number lookup failed:", error);
	}
	return data; // { id, part_number } or null
}

function partResponse(
	partId: number | null,
	partNumber: string | null,
	status: number,
	warning?: string,
) {
	return Response.json(
		{
			partId,
			partNumber,
			warning:
				partNumber === null
					? "The part was created, but its number couldn't be read. Check the queue."
					: warning,
		},
		{ status },
	);
}

function parseExportRequest(
	body: unknown,
): { part: ValidatedPart; onshape: OnshapeFields } | string {
	if (!isObject(body)) {
		return "Request body must be an object.";
	}
	const { part: p, onshape: o } = body;

	if (!isObject(p)) {
		return "part is required.";
	}
	if (!isObject(o)) {
		return "onshape is required.";
	}

	// part

	if (!isUuid(p.requestId)) {
		return "requestId must be a valid UUID.";
	}

	if (!isNonEmptyString(p.partName)) {
		return "partName is required.";
	}
	if (!isPositiveInteger(p.subsystemId)) {
		return "subsystemId must be a positive whole number.";
	}
	if (!isPositiveInteger(p.stockId)) {
		return "stockId must be a positive whole number.";
	}
	if (!isPositiveInteger(p.machineId)) {
		return "machineId must be a positive whole number.";
	}
	if (!isPositiveInteger(p.quantity)) {
		return "quantity must be a positive whole number.";
	}
	if (
		typeof p.cadMassLb !== "number" ||
		!Number.isFinite(p.cadMassLb) ||
		p.cadMassLb <= 0
	) {
		return "cadMassLb must be a positive number.";
	}

	const cadMassG = Math.round(p.cadMassLb * GRAMS_PER_POUND * 10) / 10;

	if (cadMassG === 0) {
		return "weight is too small. enter at least 0.0002 lb. ";
	}

	// onshape
	if (!isOnshapeId(o.documentId)) {
		return "onshape.documentId must be an Onshape ID.";
	}
	if (!isOnshapeId(o.workspaceId)) {
		return "onshape.workspaceId must be an Onshape ID.";
	}
	if (!isOnshapeId(o.elementId)) {
		return "onshape.elementId must be an Onshape ID.";
	}
	if (!isOnshapeId(o.microversionId)) {
		return "onshape.microversionId must be an Onshape ID.";
	}
	if (!isVisibleAscii(o.selectionId, 100)) {
		return "onshape.selectionId must be 1–100 characters with no spaces.";
	}
	if (!isOccurrencePath(o.occurrencePath)) {
		return 'onshape.occurrencePath must be instance IDs joined with ".".';
	}
	if (o.kind !== "face" && o.kind !== "body") {
		return 'onshape.kind must be "face" or "body".';
	}

	// build new object from the checked fields only
	// ...part would let a caller set any column
	// also need to translate from camel case to underscores
	return {
		part: {
			request_id: p.requestId,
			name: p.partName.trim(),
			subsystem_id: p.subsystemId,
			stock_id: p.stockId,
			machine_id: p.machineId,
			qty: p.quantity,
			cad_mass_g: cadMassG,
		},
		onshape: {
			document_id: o.documentId,
			workspace_id: o.workspaceId,
			element_id: o.elementId,
			selection_id: o.selectionId,
			microversion_id: o.microversionId,
			kind: o.kind,
			occurrence_path: o.occurrencePath,
		},
	};
}

// convert postgres error codes to json response
function insertErrorResponse(error: { code?: string; message: string }) {
	switch (error.code) {
		case "P0001": // raised exception in assign_part_number
			return Response.json({ error: error.message }, { status: 400 });
		case "23503": // foreign key: subsystem, stock, or machine doesn't exist
			return Response.json(
				{ error: "That subsystem, stock, or machine doesn't exist." },
				{ status: 400 },
			);
		case "23505": // unique. note: request_id non unique is handled elsewhere
			return Response.json(
				{ error: "That conflicts with an existing part." },
				{ status: 409 },
			);
		case "23514": // check constraint, e.g. qty out of range
			return Response.json(
				{ error: "One of the values is out of range." },
				{ status: 400 },
			);
		case "42501": // privileges or RLS refused the insert
			return Response.json(
				{ error: "You don't have permission to add parts." },
				{ status: 403 },
			);
		default:
			console.error("Part insert failed:", error);
			return Response.json(
				{ error: "Could not create the part." },
				{ status: 500 },
			);
	}
}
