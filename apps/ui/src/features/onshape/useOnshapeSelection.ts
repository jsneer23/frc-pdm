import { useEffect, useRef, useState } from "react";
import type { EntityType, SelectionType } from "../constants";

import { isInOnshape, onOnshapeMessage, postToOnshape } from "./onshapeClient";

export type OnshapeSelection = {
	selectionType: SelectionType;
	selectionId: string; // face ID or part ID
	entityType: EntityType;
	microversionId: string;
	occurrencePath: string;
};

type RequestedSelectionMessage = {
	messageName: "REQUESTED_SELECTION";
	messageId: string;
	status: { statusCode: string };
	selections: {
		selectionType: SelectionType;
		selectionId: string;
		entityType: EntityType;
		workspaceMicroversionId: string;
		occurrencePath: string[];
	}[];
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
			if (timerRef.current !== null) clearTimeout(timerRef.current);
		};
	}, []);

	function start() {
		setIsSelecting(true);

		timerRef.current = window.setTimeout(() => {
			const next: OnshapeSelection = {
				selectionType: kind,
				selectionId: "S2H2I_TEST",
				entityType: kind === "face" ? "FACE" : "undefined",
				microversionId: "55071a44bda7eb00b1963ce7",
				occurrencePath: "Mfo9ZFYspBjSQwlEr.I9Knb2G4JGJZuQeTt",
			};
			setSelection(next);
			setIsSelecting(false);
			onSelect(next);
		}, 800);
	}

	function cancel() {
		if (timerRef.current !== null) clearTimeout(timerRef.current);
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
			const msg = data as RequestedSelectionMessage;
			if (msg?.messageName !== "REQUESTED_SELECTION") return;
			if (msg.messageId !== requestIdRef.current) return;
			if (msg.status.statusCode === "PENDING") return;

			requestIdRef.current = null;
			setIsSelecting(false);

			if (msg.status.statusCode !== "SUCCESS") return;

			const first = msg.selections?.[0];
			if (!first) return;

			const next: OnshapeSelection = {
				selectionType: first.selectionType,
				selectionId: first.selectionId,
				entityType: first.entityType,
				microversionId: first.workspaceMicroversionId,
				occurrencePath: first.occurrencePath.join("."),
			};
			setSelection(next);
			onSelectRef.current(next);
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
		if (requestIdRef.current != null) postToOnshape("stopRequest");
		requestIdRef.current = null;
		setIsSelecting(false);
	}

	function clear() {
		cancel();
		setSelection(null);
	}

	return { selection, isSelecting, start, cancel, clear };
}

const useFake = !isInOnshape && import.meta.env.DEV;

export const useOnshapeSelection = useFake
	? useFakeSelection
	: useRealSelection;
