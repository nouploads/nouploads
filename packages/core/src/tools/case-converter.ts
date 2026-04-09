import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const CASE_CHOICES = [
	"upper",
	"lower",
	"title",
	"sentence",
	"camel",
	"pascal",
	"snake",
	"kebab",
	"constant",
	"dot",
] as const;

type CaseStyle = (typeof CASE_CHOICES)[number];

function splitWords(input: string): string[] {
	if (!input) return [];
	const separated = input
		.replace(/([a-z])([A-Z])/g, "$1\0$2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2");
	return separated.split(/[\s\-_.\0]+/).filter((w) => w.length > 0);
}

function convert(input: string, style: CaseStyle): string {
	const words = splitWords(input);
	switch (style) {
		case "upper":
			return input.toUpperCase();
		case "lower":
			return input.toLowerCase();
		case "title":
			return words
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
				.join(" ");
		case "sentence": {
			if (words.length === 0) return "";
			return words
				.map((w, i) =>
					i === 0
						? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
						: w.toLowerCase(),
				)
				.join(" ");
		}
		case "camel":
			return words
				.map((w, i) =>
					i === 0
						? w.toLowerCase()
						: w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
				)
				.join("");
		case "pascal":
			return words
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
				.join("");
		case "snake":
			return words.map((w) => w.toLowerCase()).join("_");
		case "kebab":
			return words.map((w) => w.toLowerCase()).join("-");
		case "constant":
			return words.map((w) => w.toUpperCase()).join("_");
		case "dot":
			return words.map((w) => w.toLowerCase()).join(".");
		default:
			return input;
	}
}

const tool: ToolDefinition = {
	id: "case-converter",
	name: "Case Converter",
	category: "developer",
	description:
		"Convert text between camelCase, snake_case, kebab-case, and more.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "case",
			type: "string",
			description: "Target case style",
			default: "camel",
			choices: [...CASE_CHOICES],
		},
	],
	capabilities: ["browser"],
	execute: async (input, options, _context) => {
		const style = (options.case as CaseStyle) || "camel";
		const text = new TextDecoder().decode(input);
		const result = convert(text, style);
		const output = new TextEncoder().encode(result);

		return {
			output,
			extension: ".txt",
			mimeType: "text/plain",
			metadata: { case: style },
		};
	},
};

registerTool(tool);
export default tool;
