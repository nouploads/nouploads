import { format } from "sql-formatter";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const SUPPORTED_DIALECTS = [
	"sql",
	"mysql",
	"postgresql",
	"sqlite",
	"bigquery",
	"snowflake",
	"mariadb",
	"transactsql",
	"plsql",
	"redshift",
];

const tool: ToolDefinition = {
	id: "sql-formatter",
	name: "SQL Formatter",
	category: "developer",
	description: "Format, beautify, and minify SQL queries.",
	inputMimeTypes: ["application/sql", "text/plain"],
	inputExtensions: [".sql"],
	options: [
		{
			name: "mode",
			type: "string",
			description: "Format or minify",
			default: "format",
			choices: ["format", "minify"],
		},
		{
			name: "dialect",
			type: "string",
			description: "SQL dialect",
			default: "sql",
			choices: SUPPORTED_DIALECTS,
		},
		{
			name: "keywordCase",
			type: "string",
			description: "Keyword casing",
			default: "upper",
			choices: ["upper", "lower", "preserve"],
		},
		{
			name: "tabWidth",
			type: "number",
			description: "Indent width",
			default: 2,
			min: 1,
			max: 8,
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const mode = (options.mode as string) || "format";
		const dialect = (options.dialect as string) || "sql";
		const keywordCase =
			(options.keywordCase as "upper" | "lower" | "preserve") || "upper";
		const tabWidth = (options.tabWidth as number) || 2;

		context.onProgress?.(10);

		let result: string;
		if (mode === "minify") {
			result = minifySqlText(text);
		} else {
			result = format(text, {
				language: dialect as "sql",
				keywordCase,
				tabWidth,
			});
		}

		context.onProgress?.(100);

		return {
			output: new TextEncoder().encode(result),
			extension: ".sql",
			mimeType: "application/sql",
		};
	},
};

/**
 * Minify SQL by collapsing runs of whitespace and stripping line and block
 * comments. Keeps strings intact so whitespace inside quoted literals is
 * preserved.
 */
export function minifySqlText(input: string): string {
	let out = "";
	let i = 0;
	const n = input.length;
	let pendingSpace = false;

	const emitChar = (c: string) => {
		if (pendingSpace && out.length > 0) {
			out += " ";
		}
		pendingSpace = false;
		out += c;
	};

	while (i < n) {
		const ch = input[i];
		const next = input[i + 1];

		// Line comment: -- ... \n (treat comment as whitespace)
		if (ch === "-" && next === "-") {
			while (i < n && input[i] !== "\n") i++;
			pendingSpace = true;
			continue;
		}
		// Block comment: /* ... */ (treat comment as whitespace)
		if (ch === "/" && next === "*") {
			i += 2;
			while (i < n && !(input[i] === "*" && input[i + 1] === "/")) i++;
			i += 2;
			pendingSpace = true;
			continue;
		}
		// Single-quoted string — preserve as-is, handle '' escape
		if (ch === "'") {
			if (pendingSpace && out.length > 0) out += " ";
			pendingSpace = false;
			out += ch;
			i++;
			while (i < n) {
				if (input[i] === "'" && input[i + 1] === "'") {
					out += "''";
					i += 2;
					continue;
				}
				out += input[i];
				if (input[i] === "'") {
					i++;
					break;
				}
				i++;
			}
			continue;
		}
		// Double-quoted identifier — preserve as-is
		if (ch === '"') {
			if (pendingSpace && out.length > 0) out += " ";
			pendingSpace = false;
			out += ch;
			i++;
			while (i < n) {
				out += input[i];
				if (input[i] === '"') {
					i++;
					break;
				}
				i++;
			}
			continue;
		}
		// Whitespace run — flag that we need to emit a separator before the next token
		if (/\s/.test(ch)) {
			pendingSpace = true;
			while (i < n && /\s/.test(input[i])) i++;
			continue;
		}
		emitChar(ch);
		i++;
	}

	return out;
}

registerTool(tool);
export default tool;
