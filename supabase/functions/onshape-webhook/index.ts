import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { verifyOnshapeSignature } from "./onshapeWebhook.ts";

export default {
	async fetch(req: Request): Promise<Response> {
		if (req.method !== "POST") {
			return new Response(null, { status: 405 });
		}

		// verify the exact text Onshape signed, before parsing it.
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
			return new Response(null, { status: 200 });
		}

		// Logged on purpose for now: the timestamp format is still unknown.
		console.log("Webhook received:", {
			timestamp: req.headers.get("x-onshape-webhook-timestamp"),
			event,
		});

		return new Response(null, { status: 200 });
	},
};
