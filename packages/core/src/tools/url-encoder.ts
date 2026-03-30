import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "url-encoder",
	name: "URL Encoder / Decoder",
	category: "developer",
	description: "Encode or decode URL components and full URLs.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "mode",
			type: "string",
			description: "Encode or decode",
			default: "encode",
			choices: ["encode", "decode"],
		},
		{
			name: "scope",
			type: "string",
			description: "Component encoding or full URL encoding",
			default: "component",
			choices: ["component", "full"],
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const mode = (options.mode as string) || "encode";
		const scope = (options.scope as string) || "component";

		context.onProgress?.(10);

		let result: string;
		if (mode === "encode") {
			result =
				scope === "component" ? encodeURIComponent(text) : encodeURI(text);
		} else {
			result =
				scope === "component" ? decodeURIComponent(text) : decodeURI(text);
		}

		context.onProgress?.(100);

		return {
			output: new TextEncoder().encode(result),
			extension: ".txt",
			mimeType: "text/plain",
		};
	},
};

registerTool(tool);
export default tool;
