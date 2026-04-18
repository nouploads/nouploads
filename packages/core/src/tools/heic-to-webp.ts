import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "heic-to-webp",
	name: "HEIC to WebP Converter",
	category: "image",
	description: "Convert HEIC/HEIF images to WebP format with quality control.",
	from: "heic",
	to: "webp",
	inputMimeTypes: ["image/heic", "image/heif"],
	inputExtensions: [".heic", ".heif"],
	options: [
		{
			name: "quality",
			type: "number",
			description: "WebP quality (1-100, higher = better quality, larger file)",
			default: 80,
			min: 1,
			max: 100,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for HEIC to WebP conversion");
		}
		const { imageBackend, onProgress } = context;
		const quality = (options.quality as number) ?? 80;

		onProgress?.(10);

		if (imageBackend.transcode) {
			const result = await imageBackend.transcode(input, "heic", "webp", {
				format: "webp",
				quality,
			});
			onProgress?.(100);
			return { output: result, extension: ".webp", mimeType: "image/webp" };
		}

		const decoded = await imageBackend.decode(input, "heic");
		onProgress?.(50);
		const encoded = await imageBackend.encode(decoded, {
			format: "webp",
			quality,
		});
		onProgress?.(100);

		return { output: encoded, extension: ".webp", mimeType: "image/webp" };
	},
};

registerTool(tool);
export default tool;
