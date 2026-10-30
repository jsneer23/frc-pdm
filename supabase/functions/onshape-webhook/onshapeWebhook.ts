const encoder = new TextEncoder();

const SIGNATURES = [
	["x-onshape-webhook-signature-primary", "ONSHAPE_WEBHOOK_SECRET_PRIMARY"],
	["x-onshape-webhook-signature-secondary", "ONSHAPE_WEBHOOK_SECRET_SECONDARY"],
] as const;

// True if either Onshape signature header matches its key.
// rawBody must be the exact request text, read before any JSON parsing.
export async function verifyOnshapeSignature(
	headers: Headers,
	rawBody: string,
): Promise<boolean> {
	const timestamp = headers.get("x-onshape-webhook-timestamp");
	if (!timestamp) return false;
	const MAX_AGE_MS = 5 * 60 * 1000;

	const sentAt = Number(timestamp);
	if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > MAX_AGE_MS) {
		return false;
	}

	const message = encoder.encode(`${timestamp}.${rawBody}`);

	for (const [header, envName] of SIGNATURES) {
		const signature = headers.get(header);
		const secret = Deno.env.get(envName);
		if (!signature || !secret) continue;

		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"],
		);

		let signatureBytes: Uint8Array<ArrayBuffer>;
		try {
			signatureBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
		} catch {
			continue; // not valid base64, so it can't match
		}

		if (await crypto.subtle.verify("HMAC", key, signatureBytes, message)) {
			return true;
		}
	}
	return false;
}
