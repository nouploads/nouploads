/**
 * HTML beautification using js-beautify (~90 KB, lazy-loaded on first call).
 * The library is shared with the JS Formatter tool so each user only pays
 * the download cost once across both tools.
 */

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
 * Beautify HTML markup using js-beautify.
 * The library is dynamically imported so it only ships when the user
 * actually clicks Format.
 */
export async function formatHtml(
	input: string,
	options: FormatHtmlOptions = {},
): Promise<string> {
	const {
		indentSize = 2,
		indentChar = "space",
		wrapLineLength = 80,
		preserveNewlines = true,
	} = options;

	const mod = await import("js-beautify");
	const beautify = mod.html ?? mod.default?.html;
	if (!beautify) {
		throw new Error("Failed to load js-beautify library");
	}

	return beautify(input, {
		indent_size: indentSize,
		indent_char: indentChar === "tab" ? "\t" : " ",
		wrap_line_length: wrapLineLength,
		preserve_newlines: preserveNewlines,
		max_preserve_newlines: 2,
		end_with_newline: true,
	});
}

/**
 * Lightweight validation — check for obviously unbalanced angle brackets.
 * Real parse errors surface from js-beautify itself, which is forgiving by
 * design (it never throws — it just returns whatever it can).
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
