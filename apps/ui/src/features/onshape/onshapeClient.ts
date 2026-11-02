// only allow onshape to embed the panel
const ALLOWED_ONSHAPE_ORIGINS: readonly string[] = ["https://cad.onshape.com"];

const params = new URLSearchParams(window.location.search);

export const onshapeContext = {
	// documentId, workspaceId, and elementId are passed from onshape to the app via the url
	// ?documentId={$documentId}&workspaceId={$workspaceOrVersionId}&elementId={$elementId}
	userId: params.get("userId") ?? "",
	documentId: params.get("documentId") ?? "",
	workspaceId: params.get("workspaceId") ?? "",
	elementId: params.get("elementId") ?? "",
	server: params.get("server") ?? "",
};

/**
 * - "demo": not in an iframe (opened directly, e.g. on github pages).
 *   selections are fake and form never posts messages
 * - "onshape": embedded by an allowed Onshape origin
 * - "rejected": embedded by anything else. route shows an error
 */
export type OnshapeMode = "demo" | "onshape" | "rejected";

// frame parent's real origin, set by the browser from the actual frames, so url
// can't fake it. works in chrome and safari only. undefined in firefox
const realParentOrigin: string | undefined =
	window.location.ancestorOrigins?.[0];

function detectMode(): OnshapeMode {
	if (window.self === window.top) {
		return "demo";
	}
	if (realParentOrigin !== undefined) {
		const allowed =
			ALLOWED_ONSHAPE_ORIGINS.includes(realParentOrigin) &&
			realParentOrigin === onshapeContext.server;
		return allowed ? "onshape" : "rejected";
	}

	// in firefox trust `server` only if it's allowlisted.
	return ALLOWED_ONSHAPE_ORIGINS.includes(onshapeContext.server)
		? "onshape"
		: "rejected";
}

export const onshapeMode = detectMode();
const isInOnshape = onshapeMode === "onshape";

export const parentOriginForDisplay =
	realParentOrigin ?? (onshapeContext.server || "an unknown page");

type Listener = (data: unknown) => void;
const listeners = new Set<Listener>();

export function onOnshapeMessage(listener: Listener) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

window.addEventListener("message", (event) => {
	if (!isInOnshape) {
		return;
	}
	if (event.source !== window.parent) {
		return;
	}
	if (event.origin !== onshapeContext.server) {
		return;
	}
	for (const listener of listeners) {
		listener(event.data);
	}
});

export function postToOnshape(messageName: string, extra: object = {}) {
	if (!isInOnshape) {
		return;
	}
	const { server, ...ids } = onshapeContext;
	window.parent.postMessage({ ...ids, messageName, ...extra }, server);
}

postToOnshape("applicationInit");
