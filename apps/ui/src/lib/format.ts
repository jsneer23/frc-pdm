export function formatThickness(inches: number | null): string {
	return inches === null ? "—" : `${inches}"`;
}

const relativeTime = new Intl.RelativeTimeFormat(undefined, {
	numeric: "auto",
});

// "2 hours ago", "yesterday", "just now". computed when a component renders,
// so it doesn't tick on its own; refetches keep it roughly current
export function timeAgo(iso: string): string {
	const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		["day", 86_400],
		["hour", 3_600],
		["minute", 60],
	];
	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) {
			return relativeTime.format(Math.round(seconds / size), unit);
		}
	}
	return "just now";
}
