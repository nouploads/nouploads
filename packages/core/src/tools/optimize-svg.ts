import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

/**
 * Basic string-level SVG cleanup when SVGO's parser crashes.
 * No XML/CSS parsing — just regex removal of comments, metadata,
 * XML declarations, and whitespace normalization.
 */
function stripSvgMetadata(svg: string): string {
	return svg
		.replace(/<\?xml[^?]*\?>\s*/g, "")
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
		.replace(/<desc[\s\S]*?<\/desc>/gi, "")
		.replace(/<title[\s\S]*?<\/title>/gi, "")
		.replace(/\s{2,}/g, " ")
		.replace(/>\s+</g, "><")
		.trim();
}

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

		// SVGO plugins can crash on complex SVGs in Safari/WebKit.
		// Try progressively safer plugin sets until one succeeds.
		let result: ReturnType<typeof optimize> | undefined;
		const attempts: Parameters<typeof optimize>[1][] = [
			// 1. Full optimization
			{ multipass, plugins: ["preset-default"] },
			// 2. Disable crash-prone path/shape plugins
			{
				multipass,
				plugins: [
					{
						name: "preset-default",
						params: {
							overrides: {
								convertPathData: false,
								mergePaths: false,
								convertShapeToPath: false,
								convertTransform: false,
							},
						},
					},
				],
			},
			// 3. Only safe metadata/cleanup plugins — no path or style transforms
			{
				multipass: false,
				plugins: [
					"removeDoctype",
					"removeXMLProcInst",
					"removeComments",
					"removeMetadata",
					"removeEditorsNSData",
					"cleanupAttrs",
					"removeEmptyAttrs",
					"removeEmptyContainers",
					"removeEmptyText",
					"removeDesc",
					"removeTitle",
					"removeUselessDefs",
				],
			},
		];
		for (const config of attempts) {
			try {
				result = optimize(svgString, config);
				break;
			} catch {
				// Try next config
			}
		}
		// If SVGO crashes entirely (e.g. css-tree parser bug in Safari),
		// fall back to basic string-level cleanup that needs no XML parser.
		const optimized = result?.data ?? stripSvgMetadata(svgString);

		const output = new TextEncoder().encode(optimized);
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
