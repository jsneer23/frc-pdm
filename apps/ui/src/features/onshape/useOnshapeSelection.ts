import { useEffect, useRef, useState } from "react";
import type { SelectionKind } from "../constants";

export type OnshapeSelection = {
	kind: SelectionKind;
	entityId: string;
	partId: string;
	partName: string;
	weightLb: number | null;
};

type Options = {
	kind: SelectionKind;
	onSelect: (selection: OnshapeSelection) => void;
};

export function useOnshapeSelection({ kind, onSelect }: Options) {
	const [selection, setSelection] = useState<OnshapeSelection | null>(null);
	const [isSelecting, setIsSelecting] = useState(false);
	const timerRef = useRef<number | null>(null);

	// Stop the fake timer when the component goes away.
	useEffect(() => {
		return () => {
			if (timerRef.current !== null) clearTimeout(timerRef.current);
		};
	}, []);

	function start() {
		setIsSelecting(true);

		// FAKE: replace this with the Onshape selection message.
		timerRef.current = window.setTimeout(() => {
			const next: OnshapeSelection = {
				kind,
				entityId: kind === "face" ? "JHD" : "JHC",
				partId: "JHC",
				partName: "Intake Side Plate",
				weightLb: 5.507,
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
