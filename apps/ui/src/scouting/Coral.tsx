import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";

function minusOne(count: number) {
	if (count > 0) return count - 1;
	return count;
}

export function autoPlusOne(count: number, others: number) {
	if (count + others < 5) return count + 1;
	return count;
}

export function telePlusOne(count: number, others: number) {
	if (count + others > 24) return count;
	if (count < 12) return count + 1;
	return count;
}

export type CoralProps = {
	levels: number[];
	setLevels: (levels: number[]) => void;
	increment: (count: number, others: number) => number;
};

type CoralButtonProps = {
	label: string;
	level: number;
	other: number;
	setLevel: (levels: number) => void;
	increment: (count: number, others: number) => number;
};

function CoralButton({
	label,
	level,
	other,
	setLevel,
	increment,
}: CoralButtonProps) {
	return (
		<div className="relative flex items-center gap-2">
			<FieldLabel className="absolute right-full w-8 text-[18px] font-semibold">
				{label}
			</FieldLabel>
			<Button
				size="icon"
				aria-label="Decrease"
				onClick={() => setLevel(minusOne(level))}
			>
				<Minus />
			</Button>
			<span className="flex h-9 w-12 items-center justify-center rounded-md border text-[16px] font-semibold tabular-nums">
				{level}
			</span>
			<Button
				size="icon"
				aria-label="Increase"
				onClick={() => setLevel(increment(level, other))}
			>
				<Plus />
			</Button>
		</div>
	);
}

export function Coral({ levels, setLevels, increment }: CoralProps) {
	const total = levels.reduce((a, b) => a + b, 0);

	const setAt = (i: number, value: number) =>
		setLevels(levels.map((v, j) => (j === i ? value : v)));
	return (
		<Field>
			<FieldLabel className="justify-center text-lg font-semibold">
				Coral
			</FieldLabel>
			<div className="flex flex-col items-center gap-3">
				{[3, 2, 1, 0].map((i) => (
					<CoralButton
						key={i}
						label={`L${i + 1}`}
						level={levels[i]}
						other={total - levels[i]}
						setLevel={(v) => setAt(i, v)}
						increment={increment}
					/>
				))}
			</div>
		</Field>
	);
}
