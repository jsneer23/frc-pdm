import { queryOptions } from "@tanstack/react-query";
import type { Tables } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

const REQUIRED = [
	"id",
	"part_number",
	"name",
	"qty",
	"status",
	"robot_code",
	"subsystem",
	"machine_label",
	"material_label",
	"exporter",
	"created_at",
	"updated_at",
	"subsystem_id",
	"machine_id",
	"stock_id",
	"exporter_id",
	"sequence_number",
] as const;

type RequiredKey = (typeof REQUIRED)[number];
type RawQueueRow = Tables<"parts_queue">;

type Prettify<T> = { [K in keyof T]: T[K] } & {};
type QueuePart = Prettify<
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

// the [number] grabs the type of a single element of the return type
// idea is the same as machines[0] but at the type level
export type RobotPartRow = Awaited<ReturnType<typeof fetchRobotQueue>>[number];

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
