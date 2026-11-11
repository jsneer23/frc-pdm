import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { isObject } from "../../lib/validators";
import type { SelectionType } from "../part-request/api";
import { onOnshapeMessage, onshapeMode, postToOnshape } from "./onshapeClient";

export type OnshapeSelection = {
	kind: SelectionType;
	selectionId: string;
	microversionId: string;
	occurrencePath: string;
};

type Options = {
	kind: SelectionType;
	onSelect: (selection: OnshapeSelection) => void;
};

function useFakeSelection({ kind, onSelect }: Options) {
	const [selection, setSelection] = useState<OnshapeSelection | null>(null);
	const [isSelecting, setIsSelecting] = useState(false);
	const timerRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	function start() {
		setIsSelecting(true);

		timerRef.current = window.setTimeout(() => {
			const next: OnshapeSelection = {
				kind: kind,
				selectionId: "S2H2I_TEST",
				microversionId: "55071a44bda7eb00b1963ce7",
				occurrencePath: "Mfo9ZFYspBjSQwlEr.I9Knb2G4JGJZuQeTt",
			};
			setSelection(next);
			setIsSelecting(false);
			onSelect(next);
		}, 800);
	}

	function cancel() {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
		}
		setIsSelecting(false);
	}

	function clear() {
		cancel();
		setSelection(null);
	}

	return { selection, isSelecting, start, cancel, clear };
}

function useRealSelection({ kind, onSelect }: Options) {
	const [selection, setSelection] = useState<OnshapeSelection | null>(null);
	const [isSelecting, setIsSelecting] = useState(false);

	const requestIdRef = useRef<string | null>(null);
	const onSelectRef = useRef(onSelect);

	useEffect(() => {
		onSelectRef.current = onSelect;
	});

	useEffect(() => {
		return onOnshapeMessage((data) => {
			if (!isObject(data) || data.messageName !== "REQUESTED_SELECTION") {
				return;
			}
			console.log(data);
			if (data.messageId !== requestIdRef.current) {
				return;
			}
			const statusCode = isObject(data.status)
				? data.status.statusCode
				: undefined;
			if (statusCode === "PENDING") {
				return;
			}

			requestIdRef.current = null;
			setIsSelecting(false);

			if (statusCode !== "SUCCESS") {
				return;
			}

			const selections = data.selections;
			if (!Array.isArray(selections) || selections.length === 0) {
				return;
			}
			const parsed = parseSelection(selections[0]);

			if (typeof parsed === "string") {
				toast.error(parsed);
				return;
			}

			setSelection(parsed);
			onSelectRef.current(parsed);
		});
	}, []);

	function start() {
		setIsSelecting(true);
		const id = crypto.randomUUID();
		requestIdRef.current = id;
		postToOnshape("requestSelection", {
			messageId: id,
			entityTypeSpecifier: [kind.toUpperCase()],
			requiredSelectionCount: 1,
		});
	}

	function cancel() {
		if (requestIdRef.current != null) {
			postToOnshape("stopRequest");
		}
		requestIdRef.current = null;
		setIsSelecting(false);
	}

	function clear() {
		cancel();
		setSelection(null);
	}

	return { selection, isSelecting, start, cancel, clear };
}

function parseSelection(raw: unknown): OnshapeSelection | string {
	if (!isObject(raw)) {
		return "Unexpected selection from Onshape.";
	}
	const {
		selectionType,
		selectionId,
		entityType,
		workspaceMicroversionId,
		occurrencePath,
	} = raw;

	const kind =
		selectionType === "ENTITY"
			? "face"
			: selectionType === "BODY"
				? "body"
				: null;
	if (kind === null) {
		return "Select a part or a face.";
	}
	if (selectionType === "face" && entityType !== "face") {
		return "Entity selected is not a face.";
	}

	if (
		typeof selectionId !== "string" ||
		typeof workspaceMicroversionId !== "string"
	) {
		return "Unexpected selection from Onshape.";
	}
	if (
		!Array.isArray(occurrencePath) ||
		occurrencePath.length === 0 ||
		!occurrencePath.every((id) => typeof id === "string")
	) {
		return "Select the part in an assembly, not a Part Studio.";
	}
	const selection: OnshapeSelection = {
		kind: kind,
		selectionId: selectionId,
		microversionId: workspaceMicroversionId,
		occurrencePath: occurrencePath.join("."),
	};

	return selection;
}

const useFake = onshapeMode === "demo";

export const useOnshapeSelection = useFake
	? useFakeSelection
	: useRealSelection;
