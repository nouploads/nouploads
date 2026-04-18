/**
 * XML ↔ JSON conversion, validation, and format detection. Single source
 * of truth for web and CLI. Uses fast-xml-parser. Sync.
 */

import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const PARSER_OPTIONS = {
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	parseAttributeValue: true,
	trimValues: true,
};

export interface ConversionResult {
	output: string;
	error?: string;
}

/** Max input size: 10 MB */
export const MAX_INPUT_SIZE = 10 * 1024 * 1024;

/**
 * Replace Unicode smart quotes and apostrophes with their ASCII
 * equivalents. Copy-pasting XML from markdown renderers or word
 * processors commonly substitutes curly quotes, which fast-xml-parser's
 * strict validator rejects while its lenient parser silently drops the
 * surrounding attributes. Normalizing first lets both paths see the
 * same well-formed input.
 */
export function normalizeSmartQuotes(input: string): string {
	return input
		.replace(/[\u201C\u201D\u201E\u201F]/g, '"')
		.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
}

export function xmlToJson(input: string, indent: number = 2): ConversionResult {
	try {
		const parser = new XMLParser(PARSER_OPTIONS);
		const parsed = parser.parse(normalizeSmartQuotes(input));
		return { output: JSON.stringify(parsed, null, indent) };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid XML";
		return { output: "", error: msg };
	}
}

export function jsonToXml(input: string, indent: number = 2): ConversionResult {
	try {
		const parsed = JSON.parse(input);
		const builder = new XMLBuilder({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
			format: true,
			indentBy: " ".repeat(indent),
		});
		return { output: builder.build(parsed) };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid JSON";
		return { output: "", error: msg };
	}
}

export function detectFormat(input: string): "xml" | "json" | "unknown" {
	const trimmed = input.trim();
	if (!trimmed) return "unknown";
	if (trimmed.startsWith("<")) return "xml";
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
	try {
		JSON.parse(trimmed);
		return "json";
	} catch {
		// not JSON
	}
	return "unknown";
}

export function validateXml(input: string): { valid: boolean; error?: string } {
	if (!input.trim()) return { valid: false, error: "Empty input" };
	const normalized = normalizeSmartQuotes(input).trimStart();
	const result = XMLValidator.validate(normalized, {
		allowBooleanAttributes: true,
	});
	if (result === true) return { valid: true };
	return { valid: false, error: result.err?.msg ?? "Invalid XML" };
}

export function validateJson(input: string): {
	valid: boolean;
	error?: string;
} {
	if (!input.trim()) return { valid: false, error: "Empty input" };
	try {
		JSON.parse(input);
		return { valid: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid JSON";
		return { valid: false, error: msg };
	}
}

const tool: ToolDefinition = {
	id: "xml-json",
	name: "XML ↔ JSON Converter",
	category: "developer",
	description: "Convert between XML and JSON with attribute preservation.",
	inputMimeTypes: ["application/xml", "text/xml", "application/json"],
	inputExtensions: [".xml", ".json"],
	options: [
		{
			name: "direction",
			type: "string",
			description: "Conversion direction",
			default: "xml-to-json",
			choices: ["xml-to-json", "json-to-xml"],
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
		const direction = (options.direction as string) || "xml-to-json";
		const indent = (options.indent as number) || 2;
		context.onProgress?.(10);

		const result =
			direction === "xml-to-json"
				? xmlToJson(text, indent)
				: jsonToXml(text, indent);
		if (result.error) throw new Error(result.error);
		context.onProgress?.(100);

		return {
			output: new TextEncoder().encode(result.output),
			extension: direction === "xml-to-json" ? ".json" : ".xml",
			mimeType:
				direction === "xml-to-json" ? "application/json" : "application/xml",
		};
	},
};

registerTool(tool);
export default tool;
