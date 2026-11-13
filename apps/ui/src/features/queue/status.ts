import type { QueuePart } from "./queries";

export type PartStatus = QueuePart["status"];

export const STATUS_BADGE: Record<
	QueuePart["status"],
	{ label: string; className: string }
> = {
	waiting_on_order: {
		label: "Waiting on order",
		className: "border-border bg-muted text-muted-foreground",
	},
	ready: {
		label: "Not started",
		className: "border-destructive/20 bg-destructive/10 text-destructive",
	},
	in_progress: {
		label: "In progress",
		className: "border-amber-500/20 bg-amber-500/10 text-amber-600",
	},
	completed: {
		label: "Complete",
		className: "border-primary/20 bg-primary/10 text-primary",
	},
};

// the order statuses appear in the filter menu: the shop's order of work
export const STATUS_ORDER: PartStatus[] = [
	"ready",
	"in_progress",
	"waiting_on_order",
	"completed",
];
