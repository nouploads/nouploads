import { getTool, isToolResultMulti } from "@nouploads/core";

export type IndentChar = "space" | "tab";

export interface FormatHtmlOptions {
	indentSize?: number;
	indentChar?: IndentChar;
	wrapLineLength?: number;
	preserveNewlines?: boolean;
}

export interface HtmlStats {
	/** Number of lines in the output */
	lines: number;
	/** Byte size of the output */
	sizeBytes: number;
}

/** Max input size: 10 MB of raw HTML text */
export const MAX_HTML_SIZE = 10 * 1024 * 1024;

export const INDENT_SIZE_OPTIONS = [
	{ value: "2", label: "2 spaces" },
	{ value: "4", label: "4 spaces" },
	{ value: "tab", label: "Tab" },
] as const;

export const WRAP_OPTIONS = [
	{ value: "0", label: "No wrap" },
	{ value: "80", label: "80 chars" },
	{ value: "120", label: "120 chars" },
	{ value: "160", label: "160 chars" },
] as const;

/**
 * Beautify HTML markup. Delegates to @nouploads/core's html-formatter tool
 * (which uses js-beautify under the hood — same library as the previous
 * forked impl, just consolidated).
 */
export async function formatHtml(
	input: string,
	options: FormatHtmlOptions = {},
): Promise<string> {
	const tool = getTool("html-formatter");
	if (!tool) throw new Error("html-formatter tool not found in core registry");

	const result = await tool.execute(
		new TextEncoder().encode(input),
		{
			indentSize: options.indentSize ?? 2,
			indentChar: options.indentChar ?? "space",
			wrapLineLength: options.wrapLineLength ?? 80,
			preserveNewlines: options.preserveNewlines !== false,
		},
		{},
	);

	if (isToolResultMulti(result)) {
		throw new Error("html-formatter unexpectedly returned multiple outputs");
	}

	return new TextDecoder().decode(result.output);
}

/**
 * Lightweight validation — check for obviously unbalanced angle brackets.
 * Real parse errors surface from js-beautify itself (which is forgiving by
 * design — it never throws). Kept local for sync UI feedback.
 */
export function validateHtml(input: string): {
	valid: boolean;
	error?: string;
} {
	if (!input.trim()) {
		return { valid: false, error: "Empty input" };
	}

	let depth = 0;
	let inString: false | "'" | '"' = false;
	let inComment = false;
	let i = 0;

	while (i < input.length) {
		// Comment handling
		if (!inString && input.startsWith("<!--", i)) {
			inComment = true;
			i += 4;
			continue;
		}
		if (inComment) {
			if (input.startsWith("-->", i)) {
				inComment = false;
				i += 3;
				continue;
			}
			i++;
			continue;
		}

		const ch = input[i];

		if (inString) {
			if (ch === inString) inString = false;
			i++;
			continue;
		}

		if (ch === "<") {
			// < followed by letter or / is a tag opener
			const next = input[i + 1];
			if (next && (/[a-zA-Z!/?]/.test(next) || next === "")) {
				depth++;
			}
		} else if (ch === ">") {
			if (depth > 0) depth--;
		} else if ((ch === '"' || ch === "'") && depth > 0) {
			inString = ch;
		}
		i++;
	}

	if (depth > 0) {
		return { valid: false, error: "Unterminated tag (missing '>')" };
	}
	if (inString) {
		return { valid: false, error: "Unterminated attribute string" };
	}
	if (inComment) {
		return { valid: false, error: "Unterminated HTML comment" };
	}
	return { valid: true };
}

export function computeHtmlStats(text: string): HtmlStats {
	return {
		lines: text ? text.split("\n").length : 0,
		sizeBytes: new TextEncoder().encode(text).byteLength,
	};
}
