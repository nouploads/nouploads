/**
 * JavaScript beautification using js-beautify (~90 KB, lazy-loaded on
 * first call). The library is shared with the HTML Formatter tool so each
 * user only pays the download cost once across both tools.
 */

export type IndentChar = "space" | "tab";
export type BraceStyle = "collapse" | "expand" | "end-expand";

export interface FormatJsOptions {
	indentSize?: number;
	indentChar?: IndentChar;
	braceStyle?: BraceStyle;
	preserveNewlines?: boolean;
}

export interface JsStats {
	/** Number of lines in the output */
	lines: number;
	/** Byte size of the output */
	sizeBytes: number;
}

/** Max input size: 10 MB of raw JavaScript text */
export const MAX_JS_SIZE = 10 * 1024 * 1024;

export const INDENT_SIZE_OPTIONS = [
	{ value: "2", label: "2 spaces" },
	{ value: "4", label: "4 spaces" },
	{ value: "tab", label: "Tab" },
] as const;

export const BRACE_STYLE_OPTIONS: { value: BraceStyle; label: string }[] = [
	{ value: "collapse", label: "Same line" },
	{ value: "expand", label: "New line" },
	{ value: "end-expand", label: "End expand" },
];

/**
 * Beautify JavaScript source using js-beautify.
 * The library is dynamically imported so it only ships when the user
 * actually clicks Format.
 */
export async function formatJs(
	input: string,
	options: FormatJsOptions = {},
): Promise<string> {
	const {
		indentSize = 2,
		indentChar = "space",
		braceStyle = "collapse",
		preserveNewlines = true,
	} = options;

	const mod = await import("js-beautify");
	const beautify = mod.js ?? mod.default?.js;
	if (!beautify) {
		throw new Error("Failed to load js-beautify library");
	}

	return beautify(input, {
		indent_size: indentSize,
		indent_char: indentChar === "tab" ? "\t" : " ",
		brace_style: braceStyle,
		preserve_newlines: preserveNewlines,
		max_preserve_newlines: 2,
		end_with_newline: true,
	});
}

/**
 * Lightweight bracket balance check. Walks the source character by character,
 * tracking string and comment context so braces inside strings or comments
 * don't distort the count. This is not a parser — js-beautify itself is
 * forgiving and rarely throws — but it catches the common "missing }" typo.
 */
export function validateJs(input: string): {
	valid: boolean;
	error?: string;
} {
	if (!input.trim()) {
		return { valid: false, error: "Empty input" };
	}

	let brace = 0;
	let paren = 0;
	let bracket = 0;
	let inString: false | "'" | '"' | "`" = false;
	let inLineComment = false;
	let inBlockComment = false;
	let escaped = false;

	for (let i = 0; i < input.length; i++) {
		const ch = input[i];
		const next = input[i + 1];

		if (inLineComment) {
			if (ch === "\n") inLineComment = false;
			continue;
		}
		if (inBlockComment) {
			if (ch === "*" && next === "/") {
				inBlockComment = false;
				i++;
			}
			continue;
		}
		if (inString) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (ch === "\\") {
				escaped = true;
				continue;
			}
			if (ch === inString) inString = false;
			continue;
		}

		// Not in string/comment
		if (ch === "/" && next === "/") {
			inLineComment = true;
			i++;
			continue;
		}
		if (ch === "/" && next === "*") {
			inBlockComment = true;
			i++;
			continue;
		}
		if (ch === "'" || ch === '"' || ch === "`") {
			inString = ch;
			continue;
		}

		if (ch === "{") brace++;
		else if (ch === "}") brace--;
		else if (ch === "(") paren++;
		else if (ch === ")") paren--;
		else if (ch === "[") bracket++;
		else if (ch === "]") bracket--;

		if (brace < 0) {
			return { valid: false, error: "Unbalanced closing brace '}'" };
		}
		if (paren < 0) {
			return { valid: false, error: "Unbalanced closing parenthesis ')'" };
		}
		if (bracket < 0) {
			return { valid: false, error: "Unbalanced closing bracket ']'" };
		}
	}

	if (brace > 0) {
		return { valid: false, error: "Unbalanced opening brace '{'" };
	}
	if (paren > 0) {
		return { valid: false, error: "Unbalanced opening parenthesis '('" };
	}
	if (bracket > 0) {
		return { valid: false, error: "Unbalanced opening bracket '['" };
	}
	if (inString) {
		return { valid: false, error: "Unterminated string literal" };
	}
	if (inBlockComment) {
		return { valid: false, error: "Unterminated block comment" };
	}
	return { valid: true };
}

export function computeJsStats(text: string): JsStats {
	return {
		lines: text ? text.split("\n").length : 0,
		sizeBytes: new TextEncoder().encode(text).byteLength,
	};
}
