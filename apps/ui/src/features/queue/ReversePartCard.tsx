import {
	Check,
	Download,
	Minus,
	Pencil,
	Play,
	Plus,
	RotateCw,
	Save,
	Undo2,
	UserRoundPen,
} from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MemberPicker } from "./MemberPicker";
import { type PartChanges, partErrorMessage, useUpdatePart } from "./mutations";
import type { QueuePart } from "./queries";

const STATUS_VERB: Record<QueuePart["status"], string> = {
	waiting_on_order: "Set waiting on material",
	ready: "Added",
	in_progress: "Set in progress",
	completed: "Completed",
};

const relativeTime = new Intl.RelativeTimeFormat(undefined, {
	numeric: "auto",
});

// "2 hours ago", "yesterday", "just now". computed when the card renders, so
// it doesn't tick on its own; the queue's refetches keep it roughly current
function timeAgo(iso: string): string {
	const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		["day", 86_400],
		["hour", 3_600],
		["minute", 60],
	];
	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) {
			return relativeTime.format(Math.round(seconds / size), unit);
		}
	}
	return "just now";
}

// the weight field's text as grams: a number, null for empty, or "invalid"
function parseWeight(text: string): number | null | "invalid" {
	const trimmed = text.trim();
	if (trimmed === "") {
		return null;
	}
	const value = Math.round(Number(trimmed) * 10) / 10;
	return Number.isFinite(value) && value > 0 ? value : "invalid";
}

// the main button's colors match the status badge it leads to
const ACTION_TONE = {
	amber:
		"border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white",
	green:
		"border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
	red: "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white",
	solid: "",
};

type ActionKind =
	| "start"
	| "giveBack"
	| "updateMaker"
	| "complete"
	| "reopen"
	| "updateCompleted"
	| "uncomplete";

const ACTION_ICON: Record<ActionKind, typeof Check> = {
	start: Play,
	giveBack: Undo2,
	updateMaker: UserRoundPen,
	complete: Check,
	reopen: Check,
	updateCompleted: Save,
	uncomplete: Undo2,
};

type ReversePartCardProps = {
	part: QueuePart;
	onFlip: () => void;
};

// PartCard renders this with a key built from the part's status, maker and
// completer, so the card starts over from the saved part whenever they change
export function ReversePartCard({ part, onFlip }: ReversePartCardProps) {
	const id = useId();
	const updatePart = useUpdatePart();
	// the people picked on this card. nothing is saved until the main button
	// is pressed; the pickers only choose people.
	const [makerId, setMakerId] = useState<number | null>(part.manufacturer_id);
	const [checkerId, setCheckerId] = useState<number | null>(part.completer_id);
	// drafts: null means "untouched, show what's saved". the count only uses
	// its draft on completed parts (in progress, each click saves).
	const [madeDraft, setMadeDraft] = useState<number | null>(null);
	const [weightDraft, setWeightDraft] = useState<string | null>(null);

	const busy = updatePart.isPending;
	const ready = part.status === "ready";
	const inProgress = part.status === "in_progress";
	const completed = part.status === "completed";
	const started = inProgress || completed;

	const made = madeDraft ?? part.qty_made;
	const weightText = weightDraft ?? part.actual_mass_g?.toString() ?? "";
	const weight = parseWeight(weightText);
	const piecesLeft = part.qty - made;
	// a different maker is picked on the card than the one saved
	const makerChanged = makerId !== part.manufacturer_id;

	// everything completing needs, apart from the maker
	const canComplete =
		piecesLeft === 0 && part.actual_mass_g !== null && checkerId !== null;

	// on a completed part: has anything been changed, and is it still complete?
	const completedEdited =
		completed &&
		(makerChanged ||
			checkerId !== part.completer_id ||
			made !== part.qty_made ||
			weight !== part.actual_mass_g);
	const stillComplete =
		piecesLeft === 0 &&
		typeof weight === "number" &&
		checkerId !== null &&
		makerId !== null;

	// the main button: one action per stage. it is the only thing on the card
	// that saves people or changes a part's status.
	let action: {
		kind: ActionKind;
		label: string;
		enabled: boolean;
		tone: keyof typeof ACTION_TONE;
	};
	if (ready) {
		action = {
			kind: "start",
			label: "Mark in progress",
			enabled: makerId !== null,
			tone: "amber",
		};
	} else if (inProgress && makerId === null) {
		// the maker was set to "Nobody": offer to put the part back
		action = {
			kind: "giveBack",
			label: "Mark not started",
			enabled: part.manufacturer_id !== null,
			tone: "red",
		};
	} else if (inProgress && makerChanged && !canComplete) {
		// a different maker was picked and the part can't be completed yet
		action = {
			kind: "updateMaker",
			label: "Update manufacturer",
			enabled: true,
			tone: "amber",
		};
	} else if (inProgress) {
		// completing also saves a newly picked maker, in the same update
		action = {
			kind: "complete",
			label: "Mark complete",
			enabled: canComplete,
			tone: "green",
		};
	} else if (completedEdited && stillComplete) {
		// edits that keep it complete: save them, status unchanged
		action = {
			kind: "updateCompleted",
			label: "Update",
			enabled: true,
			tone: "green",
		};
	} else if (completedEdited) {
		// edits that make it incomplete: save them and move it back
		action = {
			kind: "uncomplete",
			label: "Mark in progress",
			enabled:
				weight !== "invalid" && (checkerId ?? part.completer_id) !== null,
			tone: "amber",
		};
	} else {
		action = {
			kind: "reopen",
			label: "Completed",
			enabled: checkerId !== null,
			tone: "solid",
		};
	}
	const ActionIcon = ACTION_ICON[action.kind];

	const lastChange =
		part.last_event_status && part.last_event_at
			? `${STATUS_VERB[part.last_event_status]}${
					part.last_event_by ? ` by ${part.last_event_by}` : ""
				} ${timeAgo(part.last_event_at)}`
			: null;

	function save(changes: PartChanges, onSaved?: () => void) {
		updatePart.mutate(
			{ id: part.id, changes },
			{
				onSuccess: onSaved,
				onError: (error) => toast.error(partErrorMessage(error)),
			},
		);
	}

	function clearDrafts() {
		setMadeDraft(null);
		setWeightDraft(null);
	}

	// in progress the weight saves when you leave the field; on a completed
	// part it stays a draft for the main button
	function finishWeight() {
		if (weightDraft === null) {
			return;
		}
		if (weight === "invalid") {
			toast.error("Enter the weight of one piece in grams.");
			setWeightDraft(null);
			return;
		}
		if (inProgress) {
			if (weight === part.actual_mass_g) {
				setWeightDraft(null);
			} else {
				save({ actual_mass_g: weight }, () => setWeightDraft(null));
			}
		}
	}

	function changeCount(by: 1 | -1) {
		if (completed) {
			setMadeDraft(made + by);
		} else {
			save({ qty_made: part.qty_made + by });
		}
	}

	function runAction() {
		switch (action.kind) {
			case "start":
				if (makerId !== null) {
					save({
						manufacturer_id: makerId,
						status: "in_progress",
						status_changed_by_id: makerId,
					});
				}
				break;
			case "giveBack":
				// recorded as the maker who had it; the made count and weight
				// stay, since those pieces still exist
				if (part.manufacturer_id !== null) {
					save({
						status: "ready",
						manufacturer_id: null,
						status_changed_by_id: part.manufacturer_id,
					});
				}
				break;
			case "updateMaker":
				// reassigning: no status change, so no history event
				if (makerId !== null) {
					save({ manufacturer_id: makerId });
				}
				break;
			case "complete":
				if (makerId !== null && checkerId !== null) {
					save({
						status: "completed",
						manufacturer_id: makerId,
						completer_id: checkerId,
						status_changed_by_id: checkerId,
					});
				}
				break;
			case "reopen":
				// keeps the weight, clears the completer (decided Q10)
				if (checkerId !== null) {
					save({
						status: "in_progress",
						completer_id: null,
						status_changed_by_id: checkerId,
					});
				}
				break;
			case "updateCompleted":
				// still complete: save the edits, no status change, no event
				if (typeof weight === "number") {
					save(
						{
							manufacturer_id: makerId,
							completer_id: checkerId,
							qty_made: made,
							actual_mass_g: weight,
						},
						clearDrafts,
					);
				}
				break;
			case "uncomplete": {
				// no longer complete: save the edits and move it back, in one
				// update. recorded as the checker picked on the card, or the
				// saved completer if the checker was cleared.
				const changedBy = checkerId ?? part.completer_id;
				if (weight !== "invalid" && changedBy !== null) {
					save(
						{
							status: "in_progress",
							manufacturer_id: makerId ?? part.manufacturer_id,
							completer_id: null,
							qty_made: made,
							actual_mass_g: weight,
							status_changed_by_id: changedBy,
						},
						clearDrafts,
					);
				}
				break;
			}
		}
	}

	return (
		<div className="flex h-full flex-col gap-5">
			<div className="flex flex-col gap-1">
				<p className="text-xs text-muted-foreground">{part.part_number}</p>
				<h2 className="line-clamp-2 text-lg leading-tight font-semibold">
					{part.name}
				</h2>
				{lastChange && (
					<p className="text-xs text-muted-foreground">{lastChange}</p>
				)}
			</div>

			{part.status === "waiting_on_order" ? (
				<p className="text-sm text-muted-foreground">
					Waiting on material. It can be started once the material arrives.
				</p>
			) : (
				// left column: making. right column: checking.
				<div className="grid grid-cols-2 gap-x-2 gap-y-4">
					<div className="flex min-w-0 flex-col gap-1">
						<Label className="text-xs text-muted-foreground">Made by</Label>
						<MemberPicker
							label="Made by"
							value={makerId}
							onChange={setMakerId}
							// a completed part keeps a maker; reopen it to give it back
							onClear={completed ? undefined : () => setMakerId(null)}
							placeholder="Pick"
							disabled={busy}
						/>
					</div>

					<div className="flex min-w-0 flex-col gap-1">
						<Label className="text-xs text-muted-foreground">Checked by</Label>
						<MemberPicker
							label="Checked by"
							value={checkerId}
							onChange={setCheckerId}
							onClear={() => setCheckerId(null)}
							placeholder="Pick"
							disabled={!started || busy}
						/>
					</div>

					<div className="flex min-w-0 flex-col gap-1">
						<span className="text-xs text-muted-foreground">Made</span>
						<div className="flex items-center gap-1">
							<Button
								size="icon-sm"
								variant="outline"
								aria-label="One fewer made"
								className="h-9"
								disabled={!started || busy || made === 0}
								onClick={() => changeCount(-1)}
							>
								<Minus />
							</Button>
							<span className="min-w-8 flex-1 text-center tabular-nums">
								{made}/{part.qty}
							</span>
							<Button
								size="icon-sm"
								variant="outline"
								aria-label="One more made"
								className="h-9"
								disabled={!started || busy || piecesLeft === 0}
								onClick={() => changeCount(1)}
							>
								<Plus />
							</Button>
						</div>
					</div>

					<div className="flex min-w-0 flex-col gap-1">
						<Label
							htmlFor={`${id}-weight`}
							className="text-xs text-muted-foreground"
						>
							Weight (g)
						</Label>
						<Input
							id={`${id}-weight`}
							inputMode="decimal"
							placeholder={
								part.cad_mass_g === null
									? "Grams"
									: `CAD ${part.cad_mass_g.toFixed(1)}`
							}
							value={weightText}
							disabled={!started || busy}
							onChange={(event) => setWeightDraft(event.target.value)}
							onBlur={finishWeight}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.currentTarget.blur();
								}
							}}
						/>
					</div>
				</div>
			)}

			<div className="mt-auto flex flex-col gap-3">
				{part.status !== "waiting_on_order" && (
					<Button
						size="lg"
						aria-pressed={action.kind === "reopen" ? true : undefined}
						disabled={busy || !action.enabled}
						onClick={runAction}
						className={cn("w-full", ACTION_TONE[action.tone])}
					>
						<ActionIcon />
						{action.label}
					</Button>
				)}

				<div className="flex items-center gap-2">
					<Button
						size="icon-sm"
						variant="outline"
						aria-label="Download file"
						disabled
					>
						<Download />
					</Button>
					<Button
						size="icon-sm"
						variant="outline"
						aria-label="Open the part editor"
						disabled
					>
						<Pencil />
					</Button>
					<Button
						size="icon-sm"
						variant="outline"
						aria-label="Show front"
						onClick={onFlip}
						className="ml-auto"
					>
						<RotateCw />
					</Button>
				</div>
			</div>
		</div>
	);
}
