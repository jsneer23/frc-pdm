import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	type FilterOption,
	joinList,
	optionsFrom,
	type QueueSearch,
	splitList,
	statusesFrom,
	statusParam,
} from "./filters";
import type { QueuePart, Robot } from "./queries";
import { type PartStatus, STATUS_BADGE, STATUS_ORDER } from "./status";

// a filter that differs from its default gets the tinted look, so you can
// see at a glance what's narrowing the list
const ACTIVE = "border-primary/30 bg-primary/10 text-primary";

const STATUS_OPTIONS: FilterOption[] = STATUS_ORDER.map((status) => ({
	value: status,
	label: STATUS_BADGE[status].label,
}));

type FilterMenuProps = {
	label: string;
	options: FilterOption[];
	selected: string[];
	onChange: (values: string[]) => void;
	active: boolean;
};

// a multi-select dropdown: no selection means "all"
function FilterMenu({
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
						className={cn(active && ACTIVE)}
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

type FilterBarProps = {
	robots: Robot[];
	robotCode: string;
	parts: QueuePart[];
	search: QueueSearch;
	onChange: (
		patch: Partial<QueueSearch>,
		options?: { replace?: boolean },
	) => void;
};

export function FilterBar({
	robots,
	robotCode,
	parts,
	search,
	onChange,
}: FilterBarProps) {
	const newestRobot = robots[0]?.code;
	const statuses = statusesFrom(search.status);
	const filtered =
		search.q !== undefined ||
		search.subsystem !== undefined ||
		search.machine !== undefined ||
		search.material !== undefined ||
		search.status !== undefined;

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Input
				type="search"
				aria-label="Search parts"
				placeholder="Search name or number"
				value={search.q ?? ""}
				// replace: typing shouldn't add a Back step per letter
				onChange={(event) =>
					onChange({ q: event.target.value || undefined }, { replace: true })
				}
				className="h-8 w-full sm:w-56"
			/>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="outline"
							size="sm"
							className={cn(robotCode !== newestRobot && ACTIVE)}
						/>
					}
				>
					Robot: {robotCode}
					<ChevronDown className="opacity-50" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-56">
					<DropdownMenuRadioGroup
						value={robotCode}
						onValueChange={(code: string) =>
							// subsystems belong to one robot, so switching clears that filter;
							// the newest robot is the default, so it leaves the URL
							onChange({
								robot: code === newestRobot ? undefined : code,
								subsystem: undefined,
							})
						}
					>
						{robots.map((robot) => (
							<DropdownMenuRadioItem key={robot.id} value={robot.code}>
								{robot.code} · {robot.name}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<FilterMenu
				label="Subsystem"
				options={optionsFrom(
					parts,
					(part) => part.subsystem_code,
					(part) => part.subsystem,
				)}
				selected={splitList(search.subsystem)}
				onChange={(values) => onChange({ subsystem: joinList(values) })}
				active={search.subsystem !== undefined}
			/>
			<FilterMenu
				label="Machine"
				options={optionsFrom(
					parts,
					(part) => part.machine_code,
					(part) => part.machine_label,
				)}
				selected={splitList(search.machine)}
				onChange={(values) => onChange({ machine: joinList(values) })}
				active={search.machine !== undefined}
			/>
			<FilterMenu
				label="Material"
				options={optionsFrom(
					parts,
					(part) => part.material_code,
					(part) => part.material_label,
				)}
				selected={splitList(search.material)}
				onChange={(values) => onChange({ material: joinList(values) })}
				active={search.material !== undefined}
			/>
			<FilterMenu
				label="Status"
				options={STATUS_OPTIONS}
				selected={statuses}
				onChange={(values) =>
					onChange({ status: statusParam(values as PartStatus[]) })
				}
				active={search.status !== undefined}
			/>

			{filtered && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() =>
						onChange({
							q: undefined,
							subsystem: undefined,
							machine: undefined,
							material: undefined,
							status: undefined,
						})
					}
				>
					Reset
				</Button>
			)}
		</div>
	);
}
