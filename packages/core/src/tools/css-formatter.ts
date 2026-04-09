import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

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

		let result: string;
		if (mode === "minify") {
			// Strip comments
			result = text.replace(/\/\*[\s\S]*?\*\//g, "");
			// Collapse whitespace
			result = result.replace(/\s+/g, " ");
			// Remove spaces around structural characters
			result = result.replace(/\s*([{}:;,])\s*/g, "$1");
			// Remove trailing semicolons before closing braces
			result = result.replace(/;}/g, "}");
			result = result.trim();
		} else {
			// Strip comments first for clean tokenization
			let cleaned = text.replace(/\/\*[\s\S]*?\*\//g, "");
			// Collapse whitespace
			cleaned = cleaned.replace(/\s+/g, " ").trim();

			let output = "";
			let indent = 0;
			const pad = () => "  ".repeat(indent);

			for (let i = 0; i < cleaned.length; i++) {
				const ch = cleaned[i];
				if (ch === "{") {
					output = output.trimEnd();
					output += ` {\n`;
					indent++;
				} else if (ch === "}") {
					output = output.trimEnd();
					if (output.endsWith("\n")) {
						// already on new line
					} else {
						output += "\n";
					}
					indent = Math.max(0, indent - 1);
					output += `${pad()}}\n`;
				} else if (ch === ";") {
					output = output.trimEnd();
					output += `;\n`;
				} else if (ch === ":") {
					output = output.trimEnd();
					output += ": ";
				} else if (ch === " " && output.endsWith("\n")) {
					// skip leading space after newline — we add our own indent on the next char
				} else {
					// If we're at the start of a new line, add indentation
					if (output.endsWith("\n")) {
						output += pad();
					}
					output += ch;
				}
			}

			result = output.trim();
		}

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
