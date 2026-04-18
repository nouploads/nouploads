/**
 * Regex testing, match extraction, and validation. Single source of truth
 * for web and CLI. Uses only built-in RegExp — zero dependencies. Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export interface RegexMatch {
	fullMatch: string;
	index: number;
	groups: string[];
	groupNames?: Record<string, string>;
}

export interface RegexResult {
	matches: RegexMatch[];
	matchCount: number;
	error: string | null;
}

/** Max input size: 1 MB of test string text */
export const MAX_TEST_STRING_SIZE = 1 * 1024 * 1024;

export function validateRegex(
	pattern: string,
	flags: string,
): { valid: boolean; error?: string } {
	try {
		new RegExp(pattern, flags);
		return { valid: true };
	} catch (err) {
		const msg =
			err instanceof Error ? err.message : "Invalid regular expression";
		return { valid: false, error: msg };
	}
}

export function testRegex(
	pattern: string,
	flags: string,
	testString: string,
): RegexResult {
	if (!pattern) return { matches: [], matchCount: 0, error: null };

	const validation = validateRegex(pattern, flags);
	if (!validation.valid) {
		return { matches: [], matchCount: 0, error: validation.error ?? null };
	}

	const effectiveFlags = flags.includes("g") ? flags : `${flags}g`;
	const regex = new RegExp(pattern, effectiveFlags);
	const matches: RegexMatch[] = [];

	for (const match of testString.matchAll(regex)) {
		matches.push({
			fullMatch: match[0],
			index: match.index ?? 0,
			groups: match.slice(1).map((g) => g ?? ""),
			groupNames: match.groups
				? Object.fromEntries(
						Object.entries(match.groups).map(([k, v]) => [k, v ?? ""]),
					)
				: undefined,
		});
	}

	return { matches, matchCount: matches.length, error: null };
}

const tool: ToolDefinition = {
	id: "regex-tester",
	name: "Regex Tester",
	category: "developer",
	description:
		"Test regular expressions with match highlighting and capture groups.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "pattern",
			type: "string",
			description: "Regular expression pattern",
			default: "",
		},
		{
			name: "flags",
			type: "string",
			description: "Regex flags (e.g. g, i, m, s, u)",
			default: "g",
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const pattern = (options.pattern as string) || "";
		const flags = (options.flags as string) || "g";
		context.onProgress?.(10);
		if (!pattern) throw new Error("No pattern provided");
		const result = testRegex(pattern, flags, text);
		context.onProgress?.(100);
		return {
			output: new TextEncoder().encode(JSON.stringify(result, null, 2)),
			extension: ".json",
			mimeType: "application/json",
		};
	},
};

registerTool(tool);
export default tool;
