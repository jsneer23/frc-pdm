export type FilterOption = { value: string; label: string };

// the tinted look for a filter that differs from its default, so you can see
// at a glance what's narrowing the list
export const ACTIVE_FILTER = "border-primary/30 bg-primary/10 text-primary";

// TanStack Router reads values that look like JSON as JSON ("123" becomes a
// number), so accept numbers too and turn them back into text
export function textParam(value: unknown): string | undefined {
	if (typeof value === "string") {
		return value;
	}
	if (typeof value === "number") {
		return String(value);
	}
	return undefined;
}

// list filters are comma-separated codes in the URL
export function splitList(value: string | undefined): string[] {
	return value ? value.split(",").filter(Boolean) : [];
}

// an empty list is "all", which is the default, so it leaves the URL
export function joinList(values: string[]): string | undefined {
	return values.length > 0 ? values.join(",") : undefined;
}
