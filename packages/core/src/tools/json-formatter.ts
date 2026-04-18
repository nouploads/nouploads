/**
 * JSON formatting, minification, and validation. Single source of truth
 * for web and CLI. Uses only built-in JSON.* — zero dependencies. Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

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

/** Max input size: 10 MB of raw JSON text */
export const MAX_JSON_SIZE = 10 * 1024 * 1024;

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

const tool: ToolDefinition = {
	id: "json-formatter",
	name: "JSON Formatter",
	category: "developer",
	description: "Validate, format, and minify JSON data.",
	inputMimeTypes: ["application/json"],
	inputExtensions: [".json"],
	options: [
		{
			name: "mode",
			type: "string",
			description: "Format or minify",
			default: "format",
			choices: ["format", "minify"],
		},
		{
			name: "indent",
			type: "number",
			description: "Indentation spaces",
			default: 2,
			min: 1,
			max: 8,
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const mode = (options.mode as string) || "format";
		const indent = (options.indent as number) || 2;
		context.onProgress?.(10);
		const result =
			mode === "minify" ? minifyJson(text) : formatJson(text, indent);
		context.onProgress?.(100);
		return {
			output: new TextEncoder().encode(result),
			extension: ".json",
			mimeType: "application/json",
		};
	},
};

registerTool(tool);
export default tool;
