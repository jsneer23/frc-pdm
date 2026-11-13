import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { membersQueryOptions } from "./queries";

type MemberPickerProps = {
	label: string;
	value: number | null;
	onChange: (memberId: number) => void;
	// when given, the list starts with a "Nobody" choice that calls this
	onClear?: () => void;
	placeholder: string;
	disabled?: boolean;
};

export function MemberPicker({
	label,
	value,
	onChange,
	onClear,
	placeholder,
	disabled,
}: MemberPickerProps) {
	const [open, setOpen] = useState(false);
	const { data: members = [] } = useQuery(membersQueryOptions);
	const selected = members.find((member) => member.id === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				disabled={disabled}
				render={
					<Button
						variant="outline"
						aria-label={label}
						className="w-full min-w-0 justify-between font-normal"
					/>
				}
			>
				<span className="truncate">{selected?.name ?? placeholder}</span>
				<ChevronsUpDown className="opacity-50" />
			</PopoverTrigger>
			<PopoverContent className="w-56 p-0">
				<Command>
					<CommandInput placeholder="Search members" />
					<CommandList>
						<CommandEmpty>No one by that name.</CommandEmpty>
						{onClear && value !== null && (
							<CommandItem
								value="nobody"
								onSelect={() => {
									onClear();
									setOpen(false);
								}}
							>
								<X className="text-muted-foreground" />
								Nobody
							</CommandItem>
						)}
						{members.map((member) => (
							<CommandItem
								key={member.id}
								// the search matches on this text; the id keeps two members
								// with the same name distinct
								value={`${member.name} ${member.id}`}
								onSelect={() => {
									onChange(member.id);
									setOpen(false);
								}}
							>
								<Check
									className={cn(
										member.id === value ? "opacity-100" : "opacity-0",
									)}
								/>
								{member.name}
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
