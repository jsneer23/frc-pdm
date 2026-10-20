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
			"code, label, file_format, selection, materials(code, label, stocks(thickness_in))",
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
