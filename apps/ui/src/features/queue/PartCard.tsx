import { Package, RotateCw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QueuePart } from "./queries";
import { ReversePartCard } from "./ReversePartCard";
import { STATUS_BADGE } from "./status";

export function PartCard({ part }: { part: QueuePart }) {
	const [flipped, setFlipped] = useState(false);
	const exportFailed = part.export_status === "failed";
	const status = STATUS_BADGE[part.status];
	const material =
		part.thickness_in === null
			? part.material_label
			: `${part.material_label} ${part.thickness_in}"`;

	return (
		<div className="min-w-0 perspective-distant">
			<div
				className={cn(
					"grid grid-cols-1 transition-transform duration-500 transform-3d motion-reduce:transition-none",
					flipped && "rotate-y-180",
				)}
			>
				{/* front */}
				<article
					inert={flipped}
					className="col-start-1 row-start-1 flex flex-col gap-3 rounded-xl border bg-card p-3 backface-hidden"
				>
					<div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
						<Package
							className="size-10 text-muted-foreground"
							aria-hidden="true"
						/>

						{exportFailed ? (
							<Badge
								title={part.export_failure_reason ?? undefined}
								className="absolute top-2 left-2 border-transparent bg-destructive text-white"
							>
								Onshape export error
							</Badge>
						) : (
							<Badge className={cn("absolute top-2 left-2", status.className)}>
								{status.label}
							</Badge>
						)}

						<Badge variant="outline" className="absolute top-2 right-2 bg-card">
							{part.qty_made} of {part.qty} made
						</Badge>
					</div>

					<div className="flex flex-1 items-end justify-between gap-2">
						<div className="flex min-w-0 flex-col gap-1">
							<p className="text-xs text-muted-foreground">
								{part.part_number}
							</p>
							<h2 className="line-clamp-2 text-lg leading-tight font-semibold">
								{part.name}
							</h2>
							<p className="text-sm text-muted-foreground">
								{part.machine_label} · {material}
							</p>
						</div>

						<Button
							size="icon-sm"
							variant="outline"
							aria-label="Show details"
							onClick={() => setFlipped(true)}
							className="shrink-0"
						>
							<RotateCw />
						</Button>
					</div>
				</article>

				{/* back */}
				<article
					inert={!flipped}
					className="col-start-1 row-start-1 rotate-y-180 rounded-xl border bg-card p-3 backface-hidden"
				>
					<ReversePartCard
						// a new key whenever the saved status or people change, so the
						// back's picks start over from what's saved
						key={`${part.status}-${part.manufacturer_id}-${part.completer_id}`}
						part={part}
						onFlip={() => setFlipped(false)}
					/>
				</article>
			</div>
		</div>
	);
}
