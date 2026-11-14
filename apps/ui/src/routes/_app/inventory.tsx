// src/routes/_app/inventory.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	filterStocks,
	type InventorySearch,
	validateInventorySearch,
} from "@/features/inventory/filters";
import { InventoryFilterBar } from "@/features/inventory/InventoryFilterBar";
import { InventoryTable } from "@/features/inventory/InventoryTable";
import { stockInventoryQueryOptions } from "@/features/inventory/queries";
import { MemberPicker } from "@/features/queue/MemberPicker";

export const Route = createFileRoute("/_app/inventory")({
	validateSearch: validateInventorySearch,
	staticData: { title: "Inventory" },
	component: InventoryPage,
});

function InventoryPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	// who's updating: picked once, kept only while the page is open, so it
	// resets for the next person on a shared laptop
	const [updaterId, setUpdaterId] = useState<number | null>(null);
	const stocks = useQuery(stockInventoryQueryOptions);

	function changeSearch(
		patch: Partial<InventorySearch>,
		options?: { replace?: boolean },
	) {
		navigate({
			search: (previous) => ({ ...previous, ...patch }),
			replace: options?.replace,
		});
	}

	const visible = stocks.data ? filterStocks(stocks.data, search) : [];

	return (
		<div className="flex flex-1 flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<span className="text-sm text-muted-foreground">Updating as</span>
				<div className="w-44">
					<MemberPicker
						label="Updating as"
						value={updaterId}
						onChange={setUpdaterId}
						onClear={() => setUpdaterId(null)}
						placeholder="Pick who"
					/>
				</div>
				{updaterId === null && (
					<span className="text-sm text-muted-foreground">
						Pick who's updating to change stock.
					</span>
				)}
			</div>

			<InventoryFilterBar search={search} onChange={changeSearch} />

			{stocks.isPending ? (
				<p className="text-muted-foreground">Loading stock…</p>
			) : stocks.error ? (
				<p className="text-destructive">
					Couldn't load stock: {stocks.error.message}
				</p>
			) : visible.length === 0 ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
					<p className="text-muted-foreground">
						No stock matches these filters.
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							changeSearch({
								q: undefined,
								category: undefined,
								status: undefined,
								ordered: undefined,
							})
						}
					>
						Reset filters
					</Button>
				</div>
			) : (
				<InventoryTable rows={visible} updaterId={updaterId} />
			)}
		</div>
	);
}
