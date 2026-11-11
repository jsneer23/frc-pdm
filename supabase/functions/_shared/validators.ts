export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "string")
	);
}

export function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim() !== "";
}

export function isPositiveInteger(value: unknown): value is number {
	return Number.isInteger(value) && (value as number) > 0;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
	return typeof value === "string" && UUID.test(value);
}

// onshape id regex for 24 character long hex ids
const ONSHAPE_ID = /^[0-9a-f]{24}$/;

export function isOnshapeId(value: unknown): value is string {
	return typeof value === "string" && ONSHAPE_ID.test(value);
}

// verify string of only visible ascii characters of length < maxlen
// i.e. no spaces, no control characters
export function isVisibleAscii(
	value: unknown,
	maxLength: number,
): value is string {
	return (
		typeof value === "string" &&
		value.length <= maxLength &&
		/^[\x21-\x7e]+$/.test(value)
	);
}

// Instance IDs joined with ".", in nesting order. No empty segments.
export function isOccurrencePath(value: unknown): value is string {
	return (
		isVisibleAscii(value, 500) &&
		value.split(".").every((segment) => segment !== "")
	);
}
