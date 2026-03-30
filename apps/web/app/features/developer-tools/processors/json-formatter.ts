/**
 * JSON formatting, minification, and validation.
 * Uses only built-in JSON.parse() and JSON.stringify() — zero dependencies.
 */

export interface JsonValidationResult {
	valid: boolean;
	error?: string;
}

export interface JsonStats {
	/** Number of keys (for objects) or items (for arrays) at the top level */
	topLevelEntries: number;
	/** Maximum nesting depth */
	maxDepth: number;
	/** Size in bytes of the raw input */
	sizeBytes: number;
	/** Type of the root value */
	rootType: "object" | "array" | "string" | "number" | "boolean" | "null";
}

export function formatJson(input: string, indent: number = 2): string {
	const parsed = JSON.parse(input);
	return JSON.stringify(parsed, null, indent);
}

export function minifyJson(input: string): string {
	const parsed = JSON.parse(input);
	return JSON.stringify(parsed);
}

export function validateJson(input: string): JsonValidationResult {
	try {
		JSON.parse(input);
		return { valid: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid JSON";
		return { valid: false, error: msg };
	}
}

export function computeJsonStats(input: string): JsonStats | null {
	try {
		const parsed = JSON.parse(input);
		const sizeBytes = new TextEncoder().encode(input).byteLength;
		const rootType = getJsonType(parsed);

		let topLevelEntries = 0;
		if (rootType === "object" && parsed !== null) {
			topLevelEntries = Object.keys(parsed).length;
		} else if (rootType === "array") {
			topLevelEntries = parsed.length;
		}

		const maxDepth = measureDepth(parsed);

		return { topLevelEntries, maxDepth, sizeBytes, rootType };
	} catch {
		return null;
	}
}

function getJsonType(
	value: unknown,
): "object" | "array" | "string" | "number" | "boolean" | "null" {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	const t = typeof value;
	if (t === "object") return "object";
	if (t === "string") return "string";
	if (t === "number") return "number";
	if (t === "boolean") return "boolean";
	return "null";
}

function measureDepth(value: unknown): number {
	if (value === null || typeof value !== "object") return 0;
	if (Array.isArray(value)) {
		if (value.length === 0) return 1;
		let max = 0;
		for (const item of value) {
			const d = measureDepth(item);
			if (d > max) max = d;
		}
		return 1 + max;
	}
	const keys = Object.keys(value as Record<string, unknown>);
	if (keys.length === 0) return 1;
	let max = 0;
	for (const key of keys) {
		const d = measureDepth((value as Record<string, unknown>)[key]);
		if (d > max) max = d;
	}
	return 1 + max;
}

/** Max input size: 10 MB of raw JSON text */
export const MAX_JSON_SIZE = 10 * 1024 * 1024;
