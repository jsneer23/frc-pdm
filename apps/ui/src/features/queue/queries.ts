import { queryOptions } from "@tanstack/react-query";
import type { Tables } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

const REQUIRED = [
	"id",
	"part_number",
	"name",
	"qty",
	"qty_made",
	"status",
	"robot_code",
	"subsystem",
	"machine_label",
	"material_label",
	"material_code",
	"exporter",
	"created_at",
	"updated_at",
	"subsystem_id",
	"subsystem_code",
	"machine_id",
	"machine_code",
	"stock_id",
	"exporter_id",
	"sequence_number",
] as const;

type RequiredKey = (typeof REQUIRED)[number];
type RawQueueRow = Tables<"parts_queue">;

type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type QueuePart = Prettify<
	Omit<RawQueueRow, RequiredKey> & {
		[K in RequiredKey]: NonNullable<RawQueueRow[K]>;
	}
>;

async function fetchRobotQueue(robotCode: string, signal: AbortSignal) {
	const { data, error } = await supabase
		.from("parts_queue")
		.select("*")
		.eq("robot_code", robotCode)
		.is("deprecated_at", null)
		.order("part_number")
		.abortSignal(signal);

	if (error) {
		throw error;
	}

	return data.map(toQueuePart);
}

export function partsQueueQueryOptions(robotCode: string) {
	return queryOptions({
		queryKey: ["parts-queue", robotCode],
		queryFn: ({ signal }) => fetchRobotQueue(robotCode, signal),
	});
}

function toQueuePart(row: RawQueueRow): QueuePart {
	for (const key of REQUIRED) {
		if (row[key] === null) {
			throw new Error(`parts_queue row ${row.id} is missing ${key}`);
		}
	}
	return row as QueuePart;
}

async function fetchMembers(signal: AbortSignal) {
	const { data, error } = await supabase
		.from("members")
		.select("id, name")
		.order("name")
		.abortSignal(signal);

	if (error) {
		throw error;
	}

	return data;
}

export const membersQueryOptions = queryOptions({
	queryKey: ["members"],
	queryFn: ({ signal }) => fetchMembers(signal),
	staleTime: 5 * 60 * 1000,
});

async function fetchRobots(signal: AbortSignal) {
	const { data, error } = await supabase
		.from("robots")
		.select("id, code, name")
		.order("created_at", { ascending: false })
		.abortSignal(signal);

	if (error) {
		throw error;
	}

	return data;
}

export type Robot = Awaited<ReturnType<typeof fetchRobots>>[number];

export const robotsQueryOptions = queryOptions({
	queryKey: ["robots"],
	queryFn: ({ signal }) => fetchRobots(signal),
	staleTime: 5 * 60 * 1000,
});
