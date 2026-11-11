import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { isObject } from "../../lib/validators";

export type SelectionType = "face" | "body";

export type PartRequest = {
	onshape: {
		documentId: string;
		workspaceId: string;
		elementId: string;
		kind: string;
		selectionId: string;
		microversionId: string;
		occurrencePath: string;
	};
	part: {
		requestId: string;
		subsystemId: number;
		partName: string;
		machineId: number;
		stockId: number;
		quantity: number;
		cadMassLb: number;
	};
};

export type PartRequestResponse = {
	partId: number | null;
	partNumber: string | null;
	warning?: string;
};

export async function submitPartRequest(
	request: PartRequest,
): Promise<PartRequestResponse> {
	const { data, error } = await supabase.functions.invoke("onshape/export", {
		body: request,
	});
	if (error) {
		throw new Error(await functionErrorMessage(error));
	}

	return isPartRequestResponse(data);
}

async function functionErrorMessage(error: unknown): Promise<string> {
	if (error instanceof FunctionsHttpError) {
		try {
			const body = await error.context.json();
			if (typeof body?.error === "string") {
				return body.error;
			}
		} catch {
			// The response wasn't JSON; fall through to the general message.
		}
		return "Something went wrong submitting the part.";
	}
	return "Couldn't reach the server. Try again.";
}

function isPartRequestResponse(data: unknown): PartRequestResponse {
	if (!isObject(data)) {
		throw new Error("Unexpected response from the server.");
	}
	const { partId, partNumber, warning } = data;
	if (partId !== null && typeof partId !== "number") {
		throw new Error("Unexpected response from the server.");
	}
	if (partNumber !== null && typeof partNumber !== "string") {
		throw new Error("Unexpected response from the server.");
	}
	if (warning !== undefined && typeof warning !== "string") {
		throw new Error("Unexpected response from the server.");
	}
	return { partId, partNumber, warning };
}
