/**
 * YAML ↔ JSON conversion, validation, and format detection. Single
 * source of truth for web and CLI. Uses js-yaml. Sync.
 */

import yaml from "js-yaml";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export interface ConversionResult {
	output: string;
	error?: string;
}

/** Max input size: 10 MB */
export const MAX_INPUT_SIZE = 10 * 1024 * 1024;

export function yamlToJson(
	input: string,
	indent: number = 2,
): ConversionResult {
	try {
		const parsed = yaml.load(input);
		return { output: JSON.stringify(parsed, null, indent) };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid YAML";
		return { output: "", error: msg };
	}
}

export function jsonToYaml(
	input: string,
	indent: number = 2,
): ConversionResult {
	try {
		const parsed = JSON.parse(input);
		return { output: yaml.dump(parsed, { indent, lineWidth: -1 }) };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid JSON";
		return { output: "", error: msg };
	}
}

export function detectFormat(input: string): "yaml" | "json" | "unknown" {
	const trimmed = input.trim();
	if (!trimmed) return "unknown";
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
	try {
		JSON.parse(trimmed);
		return "json";
	} catch {
		// not JSON
	}
	return "yaml";
}

export function validateYaml(input: string): {
	valid: boolean;
	error?: string;
} {
	try {
		yaml.load(input);
		return { valid: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid YAML";
		return { valid: false, error: msg };
	}
}

export function validateJson(input: string): {
	valid: boolean;
	error?: string;
} {
	try {
		JSON.parse(input);
		return { valid: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid JSON";
		return { valid: false, error: msg };
	}
}

const tool: ToolDefinition = {
	id: "yaml-json",
	name: "YAML ↔ JSON Converter",
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

		const result =
			direction === "yaml-to-json"
				? yamlToJson(text, indent)
				: jsonToYaml(text, indent);
		if (result.error) throw new Error(result.error);
		context.onProgress?.(100);

		return {
			output: new TextEncoder().encode(result.output),
			extension: direction === "yaml-to-json" ? ".json" : ".yaml",
			mimeType: direction === "yaml-to-json" ? "application/json" : "text/yaml",
		};
	},
};

registerTool(tool);
export default tool;
