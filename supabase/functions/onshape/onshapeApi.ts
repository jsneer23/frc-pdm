import { isObject } from "./index.ts";

const ONSHAPE_API = "https://cad.onshape.com/api/v17";

type StepExport = {
	documentId: string;
	workspaceId: string;
	elementId: string;
	occurrencePath: string; // instance IDs joined with "."
};

export async function startStepExport(
	exp: StepExport,
): Promise<{ translationId: string } | string> {
	const accessKey = Deno.env.get("ONSHAPE_ACCESS_KEY");
	const secretKey = Deno.env.get("ONSHAPE_SECRET_KEY");
	if (!accessKey || !secretKey) return "Onshape API keys are not set.";

	if (Deno.env.get("ONSHAPE_FAKE") === "true") {
		return { translationId: `fake-${crypto.randomUUID()}` };
	}

	const url = `${ONSHAPE_API}/assemblies/d/${exp.documentId}/w/${exp.workspaceId}/e/${exp.elementId}/export/step`;

	let res: Response;
	try {
		res = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Basic ${btoa(`${accessKey}:${secretKey}`)}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				advancedParams: {
					assemblyExportParams: { occurrencesToExport: exp.occurrencePath },
				},
				notifyUser: false,
				storeInDocument: false,
				stepUnit: "INCH",
			}),
			signal: AbortSignal.timeout(15_000),
		});
	} catch (err) {
		return `Could not reach Onshape: ${String(err)}`;
	}

	const body: unknown = await res.json().catch(() => null);
	if (!res.ok) {
		const message =
			isObject(body) && typeof body.message === "string"
				? body.message
				: `Onshape returned ${res.status}.`;
		return message;
	}
	if (!isObject(body) || typeof body.id !== "string") {
		return "Onshape did not return a translation ID.";
	}
	return { translationId: body.id };
}
