import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function fetchMaterials(signal: AbortSignal) {
	// load materials query function
	// code				label
	//
	// srpp				SRPP
	// tube_2x1_7075	2x1 7075 (black)

	const { data, error } = await supabase
		.from("materials")
		.select("code, label")
		.order("id")
		.abortSignal(signal); // aborts if the request is no longer needed (i.e. form changes)

	if (error) throw error;

	return data;
}

// the [number] grabs the type of a single element of the return type
// idea is the same as machines[0] but at the type level
export type MaterialRow = Awaited<ReturnType<typeof fetchMaterials>>[number];

export const materialsQueryOptions = queryOptions({
	queryKey: ["materials"],
	queryFn: ({ signal }) => fetchMaterials(signal),
	staleTime: Infinity,
});

async function fetchMachines(signal: AbortSignal) {
	const { data, error } = await supabase
		.from("machines")
		.select(
			"id, code, label, file_format, selection, materials(code, label, stocks(id, thickness_in))",
		)
		.order("id", { referencedTable: "materials" })
		.order("thickness_in", { referencedTable: "materials.stocks" })
		.abortSignal(signal);

	if (error) throw error;

	return data;
}

export type MachineRow = Awaited<ReturnType<typeof fetchMachines>>[number];

export const machinesQueryOptions = queryOptions({
	queryKey: ["machines"],
	queryFn: ({ signal }) => fetchMachines(signal),
	staleTime: Infinity,
});

async function fetchRobots(signal: AbortSignal) {
	const { data, error } = await supabase
		.from("robots")
		.select("id, code, label:code, subsystems(id, code, label:name)")
		.order("code", { ascending: false })
		.order("id", { referencedTable: "subsystems" })
		.abortSignal(signal);

	if (error) throw error;

	return data;
}

export const robotsQueryOptions = queryOptions({
	queryKey: ["subsystems"],
	queryFn: ({ signal }) => fetchRobots(signal),
	staleTime: Infinity,
});

export type RobotRow = Awaited<ReturnType<typeof fetchRobots>>[number];
