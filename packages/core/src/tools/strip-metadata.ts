/**
 * Strip metadata tool: remove all EXIF/XMP/IPTC metadata from images by re-encoding.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const stripMetadata: ToolDefinition = {
	id: "strip-metadata",
	name: "EXIF Metadata Remover",
	category: "image",
	description: "Strip all EXIF and metadata from images for privacy.",
	inputMimeTypes: ["image/jpeg", "image/png", "image/webp"],
	inputExtensions: [".jpg", ".jpeg", ".png", ".webp"],
	options: [
		{
			name: "quality",
			type: "number",
			description: "Re-encode quality for JPEG/WebP (1-100)",
			default: 92,
			min: 1,
			max: 100,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for metadata stripping");
		}
		const { imageBackend, onProgress } = context;

		// Detect input format from magic bytes
		let detectedFormat = "png";
		if (input[0] === 0xff && input[1] === 0xd8) detectedFormat = "jpg";
		else if (input[0] === 0x89 && input[1] === 0x50) detectedFormat = "png";
		else if (
			input[0] === 0x52 &&
			input[1] === 0x49 &&
			input[8] === 0x57 &&
			input[9] === 0x45
		)
			detectedFormat = "webp";

		const quality = (options.quality as number) ?? 92;

		onProgress?.(10);

		// Round-trip decode → encode strips all metadata
		const decoded = await imageBackend.decode(input, "auto");
		onProgress?.(50);

		const output = await imageBackend.encode(decoded, {
			format: detectedFormat,
			quality,
		});
		onProgress?.(100);

		const extMap: Record<string, string> = {
			jpg: ".jpg",
			png: ".png",
			webp: ".webp",
		};
		const mimeMap: Record<string, string> = {
			jpg: "image/jpeg",
			png: "image/png",
			webp: "image/webp",
		};

		return {
			output,
			extension: extMap[detectedFormat] ?? ".png",
			mimeType: mimeMap[detectedFormat] ?? "image/png",
			metadata: {
				originalSize: input.byteLength,
				strippedSize: output.byteLength,
			},
		};
	},
};

registerTool(stripMetadata);

export { stripMetadata };
