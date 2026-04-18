import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "heic-to-png",
	name: "HEIC to PNG Converter",
	category: "image",
	description: "Convert HEIC/HEIF images to PNG format with lossless quality.",
	from: "heic",
	to: "png",
	inputMimeTypes: ["image/heic", "image/heif"],
	inputExtensions: [".heic", ".heif"],
	options: [],
	execute: async (input, _options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for HEIC to PNG conversion");
		}
		const { imageBackend, onProgress } = context;

		onProgress?.(10);

		if (imageBackend.transcode) {
			const result = await imageBackend.transcode(input, "heic", "png", {
				format: "png",
			});
			onProgress?.(100);
			return { output: result, extension: ".png", mimeType: "image/png" };
		}

		const decoded = await imageBackend.decode(input, "heic");
		onProgress?.(50);
		const encoded = await imageBackend.encode(decoded, { format: "png" });
		onProgress?.(100);

		return { output: encoded, extension: ".png", mimeType: "image/png" };
	},
};

registerTool(tool);
export default tool;
