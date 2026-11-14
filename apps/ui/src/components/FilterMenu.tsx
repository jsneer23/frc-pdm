import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACTIVE_FILTER, type FilterOption } from "@/lib/searchParams";
import { cn } from "@/lib/utils";

type FilterMenuProps = {
	label: string;
	options: FilterOption[];
	selected: string[];
	onChange: (values: string[]) => void;
	active: boolean;
};

export function FilterMenu({
	label,
	options,
	selected,
	onChange,
	active,
}: FilterMenuProps) {
	let summary = "All";
	if (selected.length === 1) {
		summary =
			options.find((option) => option.value === selected[0])?.label ??
			selected[0];
	} else if (selected.length > 1) {
		summary = String(selected.length);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className={cn(active && ACTIVE_FILTER)}
					/>
				}
			>
				{label}: {summary}
				<ChevronDown className="opacity-50" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{options.length === 0 && (
					<DropdownMenuItem disabled>Nothing to choose yet</DropdownMenuItem>
				)}
				{options.map((option) => (
					<DropdownMenuCheckboxItem
						key={option.value}
						checked={selected.includes(option.value)}
						onCheckedChange={(checked) =>
							onChange(
								checked
									? [...selected, option.value]
									: selected.filter((value) => value !== option.value),
							)
						}
					>
						{option.label}
					</DropdownMenuCheckboxItem>
				))}
				{selected.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => onChange([])}>
							Show all
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
