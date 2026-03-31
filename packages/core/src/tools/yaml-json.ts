import yaml from "js-yaml";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "yaml-json",
	name: "YAML \u2194 JSON Converter",
	category: "developer",
	description: "Convert between YAML and JSON with validation and formatting.",
	inputMimeTypes: ["text/yaml", "application/x-yaml", "application/json"],
	inputExtensions: [".yaml", ".yml", ".json"],
	options: [
		{
			name: "direction",
			type: "string",
			description: "Conversion direction",
			default: "yaml-to-json",
			choices: ["yaml-to-json", "json-to-yaml"],
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
		const direction = (options.direction as string) || "yaml-to-json";
		const indent = (options.indent as number) || 2;

		context.onProgress?.(10);

		if (direction === "yaml-to-json") {
			const parsed = yaml.load(text);
			const result = JSON.stringify(parsed, null, indent);
			context.onProgress?.(100);
			return {
				output: new TextEncoder().encode(result),
				extension: ".json",
				mimeType: "application/json",
			};
		}

		const parsed = JSON.parse(text);
		const result = yaml.dump(parsed, { indent, lineWidth: -1 });
		context.onProgress?.(100);
		return {
			output: new TextEncoder().encode(result),
			extension: ".yaml",
			mimeType: "text/yaml",
		};
	},
};

registerTool(tool);
export default tool;
