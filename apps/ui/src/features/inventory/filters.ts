import { type FilterOption, splitList, textParam } from "@/lib/searchParams";
import type { MaterialCategory, StockRow, StockStatus } from "./queries";

export type InventorySearch = {
	q?: string;
	category?: string;
	status?: string;
	ordered?: string;
};

export function validateInventorySearch(
	search: Record<string, unknown>,
): InventorySearch {
	return {
		q: textParam(search.q),
		category: textParam(search.category),
		status: textParam(search.status),
		ordered: textParam(search.ordered),
	};
}

export const CATEGORY_OPTIONS: { value: MaterialCategory; label: string }[] = [
	{ value: "plate", label: "Plate" },
	{ value: "tube", label: "Tube" },
	{ value: "shaft", label: "Shaft" },
	{ value: "filament", label: "Filament" },
];

export const STOCK_STATUS: Record<
	StockStatus,
	{ label: string; className: string }
> = {
	in_stock: {
		label: "In stock",
		className: "border-primary/30 bg-primary/10 text-primary",
	},
	low: {
		label: "Low",
		className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
	},
	out: {
		label: "Out",
		className: "border-destructive/30 bg-destructive/10 text-destructive",
	},
};

export const STOCK_STATUS_ORDER: StockStatus[] = ["in_stock", "low", "out"];

export const STATUS_OPTIONS: FilterOption[] = STOCK_STATUS_ORDER.map(
	(status) => ({
		value: status,
		label: STOCK_STATUS[status].label,
	}),
);

export const ORDERED_OPTIONS: FilterOption[] = [
	{ value: "on_order", label: "On order" },
	{ value: "not_ordered", label: "Not ordered" },
];

// the visible stocks: every filter applied; an empty list means no filter
export function filterStocks(
	rows: StockRow[],
	search: InventorySearch,
): StockRow[] {
	const q = (search.q ?? "").trim().toLowerCase();
	const categories = splitList(search.category);
	const statuses = splitList(search.status);
	const ordered = splitList(search.ordered);
	return rows.filter(
		(row) =>
			(categories.length === 0 || categories.includes(row.category)) &&
			(statuses.length === 0 || statuses.includes(row.status)) &&
			(ordered.length === 0 ||
				ordered.includes(
					row.ordered_at === null ? "not_ordered" : "on_order",
				)) &&
			(q === "" || row.material_label.toLowerCase().includes(q)),
	);
}
