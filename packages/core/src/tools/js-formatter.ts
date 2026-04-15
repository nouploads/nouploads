import { js as beautifyJs } from "js-beautify";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "js-formatter",
	name: "JavaScript Formatter",
	category: "developer",
	description: "Beautify minified or compressed JavaScript.",
	inputMimeTypes: ["application/javascript", "text/javascript"],
	inputExtensions: [".js", ".mjs", ".cjs", ".ts", ".jsx", ".tsx"],
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
			name: "braceStyle",
			type: "string",
			description: "Brace placement",
			default: "collapse",
			choices: ["collapse", "expand", "end-expand", "none"],
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
		const braceStyle = (options.braceStyle as string) ?? "collapse";
		const preserveNewlines = options.preserveNewlines !== false;

		context.onProgress?.(10);

		const result = beautifyJs(text, {
			indent_size: indentSize,
			indent_char: indentChar === "tab" ? "\t" : " ",
			brace_style: braceStyle as "collapse",
			preserve_newlines: preserveNewlines,
			max_preserve_newlines: 2,
			end_with_newline: true,
		});

		context.onProgress?.(100);

		return {
			output: new TextEncoder().encode(result),
			extension: ".js",
			mimeType: "application/javascript",
		};
	},
};

registerTool(tool);
export default tool;
