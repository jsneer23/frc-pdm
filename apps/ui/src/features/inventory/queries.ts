import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import type { Tables } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

type RawStockRow = Tables<"stock_inventory">;

// columns that are never null in practice; the view's types mark them nullable
const REQUIRED = [
	"id",
	"status",
	"material_code",
	"material_label",
	"category",
	"parts_waiting",
	"parts_ready",
	"parts_in_progress",
] as const;

type RequiredKey = (typeof REQUIRED)[number];

type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type StockRow = Prettify<
	Omit<RawStockRow, RequiredKey> & {
		[K in RequiredKey]: NonNullable<RawStockRow[K]>;
	}
>;

export type StockStatus = StockRow["status"];
export type MaterialCategory = StockRow["category"];

function toStockRow(row: RawStockRow): StockRow {
	for (const key of REQUIRED) {
		if (row[key] === null) {
			throw new Error(`stock_inventory row ${row.id} is missing ${key}`);
		}
	}
	return row as StockRow;
}

async function fetchStockInventory(signal: AbortSignal) {
	const { data, error } = await supabase
		.from("stock_inventory")
		.select("*")
		// enums sort in the order they were declared: plate, tube, shaft, filament
		.order("category")
		.order("material_label")
		.order("thickness_in", { nullsFirst: false })
		.abortSignal(signal);

	if (error) {
		throw error;
	}

	return data.map(toStockRow);
}

export const stockInventoryQueryOptions = queryOptions({
	queryKey: ["stock-inventory"],
	queryFn: ({ signal }) => fetchStockInventory(signal),
});

type SetStockArgs = {
	stockId: number;
	status: StockStatus;
	ordered: boolean;
	memberId: number;
};

// one call changes the stock, moves its parts if needed, and writes its
// history; returns how many parts moved
async function setStock({ stockId, status, ordered, memberId }: SetStockArgs) {
	const { data, error } = await supabase.rpc("set_stock", {
		p_stock_id: stockId,
		p_status: status,
		p_ordered: ordered,
		p_member_id: memberId,
	});
	if (error) {
		throw error;
	}
	return data;
}

export function useSetStock() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: setStock,
		// parts may have moved, so the queue refreshes too
		onSettled: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["stock-inventory"] }),
				queryClient.invalidateQueries({ queryKey: ["parts-queue"] }),
			]),
	});
}
