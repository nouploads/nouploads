import { html as beautifyHtml } from "js-beautify";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "html-formatter",
	name: "HTML Formatter",
	category: "developer",
	description: "Beautify HTML markup with configurable indent and wrap.",
	inputMimeTypes: ["text/html"],
	inputExtensions: [".html", ".htm"],
	options: [
		{
			name: "indentSize",
			type: "number",
			description: "Indentation width",
			default: 2,
			min: 1,
			max: 8,
		},
		{
			name: "indentChar",
			type: "string",
			description: "Indent character",
			default: "space",
			choices: ["space", "tab"],
		},
		{
			name: "wrapLineLength",
			type: "number",
			description: "Wrap lines longer than this (0 = no wrap)",
			default: 80,
			min: 0,
			max: 500,
		},
		{
			name: "preserveNewlines",
			type: "boolean",
			description: "Keep blank lines from source",
			default: true,
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const indentSize = (options.indentSize as number) ?? 2;
		const indentChar = (options.indentChar as string) ?? "space";
		const wrapLineLength = (options.wrapLineLength as number) ?? 80;
		const preserveNewlines = options.preserveNewlines !== false;

		context.onProgress?.(10);

		const result = beautifyHtml(text, {
			indent_size: indentSize,
			indent_char: indentChar === "tab" ? "\t" : " ",
			wrap_line_length: wrapLineLength,
			preserve_newlines: preserveNewlines,
			max_preserve_newlines: 2,
			end_with_newline: true,
		});

		context.onProgress?.(100);

		return {
			output: new TextEncoder().encode(result),
			extension: ".html",
			mimeType: "text/html",
		};
	},
};

registerTool(tool);
export default tool;
