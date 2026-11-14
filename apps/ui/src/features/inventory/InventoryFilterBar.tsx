// src/features/inventory/InventoryFilterBar.tsx
import { FilterMenu } from "@/components/FilterMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinList, splitList } from "@/lib/searchParams";
import {
	CATEGORY_OPTIONS,
	type InventorySearch,
	ORDERED_OPTIONS,
	STATUS_OPTIONS,
} from "./filters";

type InventoryFilterBarProps = {
	search: InventorySearch;
	onChange: (
		patch: Partial<InventorySearch>,
		options?: { replace?: boolean },
	) => void;
};

export function InventoryFilterBar({
	search,
	onChange,
}: InventoryFilterBarProps) {
	const filtered =
		search.q !== undefined ||
		search.category !== undefined ||
		search.status !== undefined ||
		search.ordered !== undefined;

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Input
				type="search"
				aria-label="Search materials"
				placeholder="Search materials"
				value={search.q ?? ""}
				// replace: typing shouldn't add a Back step per letter
				onChange={(event) =>
					onChange({ q: event.target.value || undefined }, { replace: true })
				}
				className="h-8 w-full sm:w-56"
			/>
			<FilterMenu
				label="Category"
				options={CATEGORY_OPTIONS}
				selected={splitList(search.category)}
				onChange={(values) => onChange({ category: joinList(values) })}
				active={search.category !== undefined}
			/>
			<FilterMenu
				label="Status"
				options={STATUS_OPTIONS}
				selected={splitList(search.status)}
				onChange={(values) => onChange({ status: joinList(values) })}
				active={search.status !== undefined}
			/>
			<FilterMenu
				label="Ordered"
				options={ORDERED_OPTIONS}
				selected={splitList(search.ordered)}
				onChange={(values) => onChange({ ordered: joinList(values) })}
				active={search.ordered !== undefined}
			/>
			{filtered && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() =>
						onChange({
							q: undefined,
							category: undefined,
							status: undefined,
							ordered: undefined,
						})
					}
				>
					Reset
				</Button>
			)}
		</div>
	);
}
