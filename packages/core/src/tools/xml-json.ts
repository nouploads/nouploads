import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const DEFAULT_PARSER_OPTIONS = {
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	parseAttributeValue: true,
	trimValues: true,
};

/**
 * Normalize Unicode smart quotes to ASCII so that XML copy-pasted from
 * markdown renderers or word processors parses correctly instead of
 * silently dropping attributes.
 */
function normalizeSmartQuotes(input: string): string {
	return input
		.replace(/[\u201C\u201D\u201E\u201F]/g, '"')
		.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
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

		if (direction === "xml-to-json") {
			const parser = new XMLParser(DEFAULT_PARSER_OPTIONS);
			const parsed = parser.parse(normalizeSmartQuotes(text));
			const result = JSON.stringify(parsed, null, indent);
			context.onProgress?.(100);
			return {
				output: new TextEncoder().encode(result),
				extension: ".json",
				mimeType: "application/json",
			};
		}

		const parsed = JSON.parse(text);
		const builder = new XMLBuilder({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
			format: true,
			indentBy: " ".repeat(indent),
		});
		const result = builder.build(parsed);
		context.onProgress?.(100);
		return {
			output: new TextEncoder().encode(result),
			extension: ".xml",
			mimeType: "application/xml",
		};
	},
};

registerTool(tool);
export default tool;
