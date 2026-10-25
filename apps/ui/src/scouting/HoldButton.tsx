import { cn } from "cn";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const HOLD_COLORS = {
	primary: {
		idle: "border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
		holding: "bg-primary text-primary-foreground",
		done: "bg-primary text-primary-foreground",
	},
	destructive: {
		idle: "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white",
		holding: "bg-destructive text-white hover:bg-destructive hover:text-white",
		done: "bg-destructive text-primary-foreground hover:bg-destructive hover:text-white",
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

	const currentLabel = done ? doneLabel : holding ? "Keep holding…" : idleLabel;

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
					: holding
						? HOLD_COLORS[variant].holding
						: cn(
								"border-border bg-background text-secondary-foreground",
								HOLD_COLORS[variant].idle,
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
			<span className="relative grid">
				{[idleLabel, "Keep holding…", doneLabel].map((text) => (
					<span
						key={text}
						className={cn(
							"col-start-1 row-start-1",
							text !== currentLabel && "invisible",
						)}
					>
						{text}
					</span>
				))}
			</span>
		</Button>
	);
}
