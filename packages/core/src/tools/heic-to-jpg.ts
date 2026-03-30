import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "heic-to-jpg",
	name: "HEIC to JPG Converter",
	category: "image",
	description:
		"Convert HEIC/HEIF images to JPG format. Preserves image quality with adjustable compression.",
	from: "heic",
	to: "jpg",
	inputMimeTypes: ["image/heic", "image/heif"],
	inputExtensions: [".heic", ".heif"],
	options: [
		{
			name: "quality",
			type: "number",
			description: "JPG quality (1-100, higher = better quality, larger file)",
			default: 80,
			min: 1,
			max: 100,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for HEIC to JPG conversion");
		}
		const { imageBackend, onProgress } = context;
		const quality = (options.quality as number) ?? 80;

		onProgress?.(10);

		// Try direct transcoding first (may be more efficient)
		if (imageBackend.transcode) {
			const result = await imageBackend.transcode(input, "heic", "jpeg", {
				format: "jpeg",
				quality,
			});
			onProgress?.(100);
			return {
				output: result,
				extension: ".jpg",
				mimeType: "image/jpeg",
			};
		}

		// Fallback: decode -> encode
		const decoded = await imageBackend.decode(input, "heic");
		onProgress?.(50);
		const encoded = await imageBackend.encode(decoded, {
			format: "jpeg",
			quality,
		});
		onProgress?.(100);

		return {
			output: encoded,
			extension: ".jpg",
			mimeType: "image/jpeg",
		};
	},
};

registerTool(tool);
export default tool;
