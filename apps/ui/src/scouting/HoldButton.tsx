import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HOLD_COLORS = {
	primary: {
		idle: "border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
		fill: "bg-primary/40 sm:bg-primary sm:text-white hover:bg-primary hover:text-primary-foreground",
		done: "bg-primary text-primary-foreground",
	},
	destructive: {
		idle: "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white",
		fill: "bg-destructive/40 sm:bg-destructive sm:text-white hover:bg-destructive hover:text-white",
		done: "bg-destructive text-primary-foreground",
	},
};

type HoldButtonProps = {
	disabled?: boolean;
	onComplete: () => void;
	idleLabel: string;
	doneLabel: string;
	variant: keyof typeof HOLD_COLORS;
};

export function HoldButton({
	disabled,
	onComplete,
	idleLabel,
	doneLabel,
	variant,
}: HoldButtonProps) {
	const [holding, setHolding] = useState(false);
	const [done, setDone] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const HOLD_MS = 1500;

	const start = () => {
		setHolding(true);
		timer.current = setTimeout(() => {
			setHolding(false);
			setDone(true);
			onComplete();
		}, HOLD_MS);
	};

	const cancel = () => {
		setHolding(false);
		clearTimeout(timer.current);
	};

	return (
		<Button
			disabled={disabled}
			onPointerDown={start}
			onPointerUp={cancel}
			onPointerLeave={cancel}
			onPointerCancel={cancel}
			className={cn(
				"relative overflow-hidden select-none",
				done
					? HOLD_COLORS[variant].done
					: cn(
							"border-border bg-background text-secondary-foreground",
							HOLD_COLORS[variant].fill,
						),
			)}
		>
			<span
				className="absolute inset-y-0 left-0 bg-white/30"
				style={{
					width: holding ? "100%" : "0%",
					transition: holding ? `width ${HOLD_MS}ms linear` : "none",
				}}
			/>
			<span className="relative">
				{done ? doneLabel : holding ? "Keep holding…" : idleLabel}
			</span>
		</Button>
	);
}
