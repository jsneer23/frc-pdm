const params = new URLSearchParams(window.location.search);

export const onshapeContext = {
	documentId: params.get("documentId") ?? "",
	workspaceId: params.get("workspaceId") ?? "",
	elementId: params.get("elementId") ?? "",
	server: params.get("server") ?? "",
};

export const isInOnshape = onshapeContext.server !== "";

type Listener = (data: unknown) => void;
const listeners = new Set<Listener>();

export function onOnshapeMessage(listener: Listener) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

window.addEventListener("message", (event) => {
	if (event.origin !== onshapeContext.server) return;
	console.log("[onshape]", event.data);
	for (const listener of listeners) listener(event.data);
});

export function postToOnshape(messageName: string, extra: object = {}) {
	const { server, ...ids } = onshapeContext;
	if (!server) {
		console.warn(`[onshape] No server parameter. "${messageName}" not sent.`);
		return;
	}
	window.parent.postMessage({ ...ids, messageName, ...extra }, server);
}

postToOnshape("applicationInit");
