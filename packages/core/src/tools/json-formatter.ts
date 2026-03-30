import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

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

		const parsed = JSON.parse(text);
		const result =
			mode === "minify"
				? JSON.stringify(parsed)
				: JSON.stringify(parsed, null, indent);

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
