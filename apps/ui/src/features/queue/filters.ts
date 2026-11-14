import { type FilterOption, splitList, textParam } from "@/lib/searchParams";
import type { QueuePart } from "./queries";
import { type PartStatus, STATUS_ORDER } from "./status";

// the queue's URL search parameters. list filters are comma-separated codes,
// so links stay readable (?machine=router,co2_laser). a missing parameter
// means its default: the newest robot, statuses ready and in progress,
// everything else all. status="" means every status.
export type QueueSearch = {
	robot?: string;
	q?: string;
	subsystem?: string;
	machine?: string;
	material?: string;
	status?: string;
};

export const DEFAULT_STATUSES: PartStatus[] = ["ready", "in_progress"];

// turns whatever is in the URL into clean filters; anything else is dropped
export function validateQueueSearch(
	search: Record<string, unknown>,
): QueueSearch {
	return {
		robot: textParam(search.robot),
		q: textParam(search.q),
		subsystem: textParam(search.subsystem),
		machine: textParam(search.machine),
		material: textParam(search.material),
		status: textParam(search.status),
	};
}

export function statusesFrom(value: string | undefined): PartStatus[] {
	if (value === undefined) {
		return DEFAULT_STATUSES;
	}
	return splitList(value).filter((status): status is PartStatus =>
		(STATUS_ORDER as string[]).includes(status),
	);
}

// the default selection leaves the URL; no selection is "all", written as ""
export function statusParam(selected: PartStatus[]): string | undefined {
	const isDefault =
		selected.length === DEFAULT_STATUSES.length &&
		DEFAULT_STATUSES.every((status) => selected.includes(status));
	return isDefault ? undefined : selected.join(",");
}

type QueueFilters = {
	q: string;
	subsystems: string[];
	machines: string[];
	materials: string[];
	statuses: PartStatus[];
};

function filtersFrom(search: QueueSearch): QueueFilters {
	return {
		q: (search.q ?? "").trim().toLowerCase(),
		subsystems: splitList(search.subsystem),
		machines: splitList(search.machine),
		materials: splitList(search.material),
		statuses: statusesFrom(search.status),
	};
}

// the visible parts: the robot's parts narrowed by every filter. an empty
// list means "no filter" for that field
export function filterParts(
	parts: QueuePart[],
	search: QueueSearch,
): QueuePart[] {
	const f = filtersFrom(search);
	return parts.filter(
		(part) =>
			(f.statuses.length === 0 || f.statuses.includes(part.status)) &&
			(f.subsystems.length === 0 ||
				f.subsystems.includes(part.subsystem_code)) &&
			(f.machines.length === 0 || f.machines.includes(part.machine_code)) &&
			(f.materials.length === 0 || f.materials.includes(part.material_code)) &&
			(f.q === "" ||
				part.name.toLowerCase().includes(f.q) ||
				part.part_number.toLowerCase().includes(f.q)),
	);
}

// the choices for a menu, taken from the robot's parts: each code once,
// sorted by its label
export function optionsFrom(
	parts: QueuePart[],
	value: (part: QueuePart) => string,
	label: (part: QueuePart) => string,
): FilterOption[] {
	const seen = new Map<string, string>();
	for (const part of parts) {
		seen.set(value(part), label(part));
	}
	return [...seen]
		.map(([optionValue, optionLabel]) => ({
			value: optionValue,
			label: optionLabel,
		}))
		.sort((a, b) => a.label.localeCompare(b.label));
}
