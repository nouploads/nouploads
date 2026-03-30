import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "optimize-svg",
	name: "SVG Optimizer",
	category: "image",
	description:
		"Optimize and minify SVG files. Removes unnecessary metadata, comments, and whitespace.",
	inputMimeTypes: ["image/svg+xml"],
	inputExtensions: [".svg"],
	options: [
		{
			name: "multipass",
			type: "boolean",
			description: "Run multiple optimization passes for better results",
			default: true,
		},
	],
	execute: async (input, options) => {
		const { optimize } = await import("svgo");
		const svgString = new TextDecoder().decode(input);
		const multipass = (options.multipass as boolean) ?? true;

		const result = optimize(svgString, {
			multipass,
			plugins: ["preset-default"],
		});

		const output = new TextEncoder().encode(result.data);
		return {
			output,
			extension: ".svg",
			mimeType: "image/svg+xml",
			metadata: {
				originalSize: input.byteLength,
				optimizedSize: output.byteLength,
				savings: input.byteLength - output.byteLength,
			},
		};
	},
};

registerTool(tool);
export default tool;
