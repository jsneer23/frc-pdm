import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatThickness, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STOCK_STATUS, STOCK_STATUS_ORDER } from "./filters";
import { type StockRow, type StockStatus, useSetStock } from "./queries";

function partsText(count: number): string {
	return count === 1 ? "1 part" : `${count} parts`;
}

// a status change that moves parts, waiting for confirmation
type PendingChange = {
	row: StockRow;
	status: StockStatus;
	moving: number;
};

type InventoryTableProps = {
	rows: StockRow[];
	// who's updating, picked once at the top of the page; null = nobody yet
	updaterId: number | null;
};

export function InventoryTable({ rows, updaterId }: InventoryTableProps) {
	const setStock = useSetStock();
	const [pending, setPending] = useState<PendingChange | null>(null);
	const locked = updaterId === null || setStock.isPending;

	function save(row: StockRow, status: StockStatus, ordered: boolean) {
		if (updaterId === null) {
			return;
		}
		setStock.mutate(
			{ stockId: row.id, status, ordered, memberId: updaterId },
			{
				onSuccess: (moved) => {
					if (moved > 0) {
						toast.success(
							status === "out"
								? `${partsText(moved)} moved to waiting on order.`
								: `${partsText(moved)} ready to make.`,
						);
					}
				},
				onError: () => toast.error("Couldn't update the stock. Try again."),
			},
		);
	}

	// changes that move parts (into or out of "out") ask first; the rest save
	function changeStatus(row: StockRow, status: StockStatus) {
		if (status === row.status) {
			return;
		}
		let moving = 0;
		if (status === "out") {
			moving = row.parts_ready;
		} else if (row.status === "out") {
			moving = row.parts_waiting;
		}
		if (moving > 0) {
			setPending({ row, status, moving });
		} else {
			save(row, status, row.ordered_at !== null);
		}
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Material</TableHead>
						<TableHead>Thickness</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Ordered</TableHead>
						<TableHead className="text-right">Waiting</TableHead>
						<TableHead className="text-right">Ready</TableHead>
						<TableHead className="text-right">In progress</TableHead>
						<TableHead>Last change</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row, index) => {
						// a material's name shows only on its first row, so each
						// material reads as a group
						const firstOfMaterial =
							rows[index - 1]?.material_code !== row.material_code;
						return (
							<TableRow key={row.id}>
								<TableCell className="font-medium">
									{firstOfMaterial ? row.material_label : ""}
								</TableCell>
								<TableCell className="tabular-nums">
									{formatThickness(row.thickness_in)}
								</TableCell>
								<TableCell>
									<fieldset className="flex gap-1">
										<legend className="sr-only">
											Status of {row.material_label}{" "}
											{formatThickness(row.thickness_in)}
										</legend>
										{STOCK_STATUS_ORDER.map((status) => {
											const current = status === row.status;
											return (
												<Button
													key={status}
													size="sm"
													variant="outline"
													aria-pressed={current}
													disabled={locked}
													onClick={() => changeStatus(row, status)}
													className={cn(
														"h-7 px-2",
														current && STOCK_STATUS[status].className,
													)}
												>
													{STOCK_STATUS[status].label}
												</Button>
											);
										})}
									</fieldset>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Checkbox
											aria-label={`${row.material_label} ${formatThickness(row.thickness_in)} on order`}
											checked={row.ordered_at !== null}
											disabled={locked}
											onCheckedChange={(checked) =>
												save(row, row.status, checked === true)
											}
										/>
										{row.ordered_at && (
											<span className="text-xs text-muted-foreground">
												{timeAgo(row.ordered_at)}
											</span>
										)}
									</div>
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{row.parts_waiting}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{row.parts_ready}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{row.parts_in_progress}
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{row.last_change_at
										? `${row.last_change_by}, ${timeAgo(row.last_change_at)}`
										: "—"}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			<AlertDialog
				open={pending !== null}
				onOpenChange={(open) => !open && setPending(null)}
			>
				<AlertDialogContent>
					{pending && (
						<>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Mark {pending.row.material_label}{" "}
									{formatThickness(pending.row.thickness_in)}{" "}
									{STOCK_STATUS[pending.status].label.toLowerCase()}?
								</AlertDialogTitle>
								<AlertDialogDescription>
									{pending.status === "out"
										? `${partsText(pending.moving)} will move from ready to waiting on order.`
										: `${partsText(pending.moving)} will move from waiting on order to ready.`}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<Button variant="outline" onClick={() => setPending(null)}>
									Cancel
								</Button>
								<Button
									onClick={() => {
										save(
											pending.row,
											pending.status,
											pending.row.ordered_at !== null,
										);
										setPending(null);
									}}
								>
									{pending.status === "out" ? "Mark out" : "Mark available"}
								</Button>
							</AlertDialogFooter>
						</>
					)}
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
