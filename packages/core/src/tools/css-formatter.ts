/**
 * CSS minification and beautification. Single source of truth for web
 * and CLI. Uses only regex/string manipulation — zero dependencies. Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

/** Max input size: 10 MB of raw CSS text */
export const MAX_CSS_SIZE = 10 * 1024 * 1024;

export function minifyCss(input: string): string {
	let result = input.replace(/\/\*[\s\S]*?\*\//g, "");
	result = result.replace(/\s+/g, " ");
	result = result.replace(/\s*([{}:;,])\s*/g, "$1");
	result = result.replace(/;}/g, "}");
	return result.trim();
}

export function beautifyCss(input: string): string {
	let cleaned = input.replace(/\/\*[\s\S]*?\*\//g, "");
	cleaned = cleaned.replace(/\s+/g, " ").trim();
	if (!cleaned) return "";

	let output = "";
	let indent = 0;
	const pad = () => "  ".repeat(indent);

	for (let i = 0; i < cleaned.length; i++) {
		const ch = cleaned[i];
		if (ch === "{") {
			output = output.trimEnd();
			output += " {\n";
			indent++;
		} else if (ch === "}") {
			output = output.trimEnd();
			if (!output.endsWith("\n")) output += "\n";
			indent = Math.max(0, indent - 1);
			output += `${pad()}}\n`;
		} else if (ch === ";") {
			output = output.trimEnd();
			output += ";\n";
		} else if (ch === ":") {
			output = output.trimEnd();
			output += ": ";
		} else if (ch === " " && output.endsWith("\n")) {
			// skip leading space after newline
		} else {
			if (output.endsWith("\n")) output += pad();
			output += ch;
		}
	}
	return output.trim();
}

export interface CssSavings {
	originalSize: number;
	outputSize: number;
	savingsPercent: number;
}

export function calculateSavings(original: string, output: string): CssSavings {
	const originalSize = new TextEncoder().encode(original).byteLength;
	const outputSize = new TextEncoder().encode(output).byteLength;
	const savingsPercent =
		originalSize > 0
			? Math.round(((originalSize - outputSize) / originalSize) * 100)
			: 0;
	return { originalSize, outputSize, savingsPercent };
}

const tool: ToolDefinition = {
	id: "css-formatter",
	name: "CSS Formatter",
	category: "developer",
	description: "Minify or beautify CSS with size comparison.",
	inputMimeTypes: ["text/css"],
	inputExtensions: [".css"],
	options: [
		{
			name: "mode",
			type: "string",
			description: "Minify or beautify",
			default: "beautify",
			choices: ["minify", "beautify"],
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const mode = (options.mode as string) || "beautify";
		context.onProgress?.(10);
		const result = mode === "minify" ? minifyCss(text) : beautifyCss(text);
		context.onProgress?.(100);
		return {
			output: new TextEncoder().encode(result),
			extension: ".css",
			mimeType: "text/css",
		};
	},
};

registerTool(tool);
export default tool;
