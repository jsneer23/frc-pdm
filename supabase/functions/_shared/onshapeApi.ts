import { isObject, isOnshapeId, isStringArray } from "./validators.ts";

type OnshapeRequest = {
	method?: "GET" | "POST";
	body?: unknown; // sent as JSON when present
	accept?: string; // defaults to JSON
};

const ONSHAPE_API = "https://cad.onshape.com/api/v17";
const isFake = () => Deno.env.get("ONSHAPE_FAKE") === "true";

// builds api path and encodes every value, so "/", "?", and "#" inside
// a value can't add path segments or a query string
function apiPath(strings: TemplateStringsArray, ...values: string[]): string {
	let path = strings[0];
	values.forEach((value, i) => {
		path += encodeURIComponent(value) + strings[i + 1];
	});
	return path;
}

async function onshapeFetch(
	path: string,
	{ method = "GET", body, accept = "application/json" }: OnshapeRequest = {},
): Promise<Response | string> {
	const accessKey = Deno.env.get("ONSHAPE_ACCESS_KEY");
	const secretKey = Deno.env.get("ONSHAPE_SECRET_KEY");
	if (!accessKey || !secretKey) {
		return "Onshape API keys are not set.";
	}

	const headers: Record<string, string> = {
		Authorization: `Basic ${btoa(`${accessKey}:${secretKey}`)}`,
		Accept: accept,
	};
	if (body !== undefined) {
		headers["Content-Type"] = "application/json";
	}

	let res: Response;
	try {
		res = await fetch(`${ONSHAPE_API}${path}`, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(15_000),
		});
	} catch (err) {
		return `Could not reach Onshape: ${String(err)}`;
	}

	if (!res.ok) {
		const error: unknown = await res.json().catch(() => null);
		return isObject(error) && typeof error.message === "string"
			? error.message
			: `Onshape returned ${res.status}.`;
	}
	return res;
}

async function onshapeJson(
	path: string,
	init?: OnshapeRequest,
): Promise<Record<string, unknown> | string> {
	const res = await onshapeFetch(path, init);
	if (typeof res === "string") {
		return res;
	}

	const body: unknown = await res.json().catch(() => null);
	if (!isObject(body)) {
		return "Onshape returned an unexpected response.";
	}
	return body;
}

type StepExport = {
	documentId: string;
	workspaceId: string;
	elementId: string;
	occurrencePath: string; // instance IDs joined with "."
};

export async function startStepExport(
	exp: StepExport,
): Promise<{ translationId: string } | string> {
	// ensure user supplied onshape ids have valid format
	if (![exp.documentId, exp.workspaceId, exp.elementId].every(isOnshapeId)) {
		return "Invalid Onshape document, workspace, or element ID.";
	}
	// don't waste api call in def env
	if (isFake()) {
		return { translationId: `fake-${crypto.randomUUID()}` };
	}

	const endpoint = apiPath`/assemblies/d/${exp.documentId}/w/${exp.workspaceId}/e/${exp.elementId}/export/step`;
	const request: OnshapeRequest = {
		method: "POST",
		body: {
			advancedParams: {
				assemblyExportParams: { occurrencesToExport: exp.occurrencePath },
			},
			notifyUser: false,
			storeInDocument: false,
			stepUnit: "INCH",
		},
	};
	const body = await onshapeJson(endpoint, request);

	if (typeof body === "string") {
		return body;
	}

	if (typeof body.id !== "string") {
		return "Onshape did not return a translation ID.";
	}
	return { translationId: body.id };
}

export async function getTranslationInfo(
	translationId: string,
): Promise<{ externalDataId: string } | string> {
	if (isFake()) {
		return { externalDataId: `fake-${crypto.randomUUID()}` };
	}

	const endpoint = apiPath`/translations/${translationId}`;
	const body = await onshapeJson(endpoint);

	if (typeof body === "string") {
		return body;
	}

	if (body.requestState === "FAILED") {
		return typeof body.failureReason === "string"
			? `Onshape export failed: ${body.failureReason}`
			: "Onshape export failed.";
	}
	if (body.requestState !== "DONE") {
		return `Export not finished (state: ${String(body.requestState)}).`;
	}

	const ids = body.resultExternalDataIds;
	if (!isStringArray(ids) || ids.length !== 1) {
		return "Onshape did not return exactly one file.";
	}

	return { externalDataId: ids[0] };
}

export async function downloadExternalData(
	documentId: string,
	fileId: string,
): Promise<{ bytes: ArrayBuffer } | string> {
	// ensure user supplied onshape ids have valid format
	if (!isOnshapeId(documentId)) {
		return "Invalid Onshape document ID.";
	}

	// don't waste api call in dev env
	if (isFake()) {
		return { bytes: new TextEncoder().encode("fake STEP file").buffer };
	}

	const endpoint = apiPath`/documents/d/${documentId}/externaldata/${fileId}`;
	const res = await onshapeFetch(endpoint, {
		accept: "application/octet-stream",
	});
	if (typeof res === "string") {
		return res;
	}

	try {
		return { bytes: await res.arrayBuffer() };
	} catch (err) {
		return `Download from Onshape failed: ${String(err)}`;
	}
}
