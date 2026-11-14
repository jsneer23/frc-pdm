import { ChevronDown } from "lucide-react";
import { FilterMenu } from "@/components/FilterMenu";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	ACTIVE_FILTER,
	type FilterOption,
	joinList,
	splitList,
} from "@/lib/searchParams";
import { cn } from "@/lib/utils";
import {
	optionsFrom,
	type QueueSearch,
	statusesFrom,
	statusParam,
} from "./filters";
import type { QueuePart, Robot } from "./queries";
import { type PartStatus, STATUS_BADGE, STATUS_ORDER } from "./status";

const STATUS_OPTIONS: FilterOption[] = STATUS_ORDER.map((status) => ({
	value: status,
	label: STATUS_BADGE[status].label,
}));

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
							className={cn(robotCode !== newestRobot && ACTIVE_FILTER)}
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
