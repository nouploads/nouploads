/**
 * EXIF metadata tools: exif-view (read metadata) and exif-strip (remove metadata).
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const exifView: ToolDefinition = {
	id: "exif-view",
	name: "EXIF Metadata Viewer",
	category: "image",
	description:
		"Extract and display EXIF metadata from images as JSON. Supports JPEG, TIFF, HEIC, and WebP.",
	inputMimeTypes: [
		"image/jpeg",
		"image/tiff",
		"image/heic",
		"image/heif",
		"image/webp",
		"image/png",
	],
	inputExtensions: [
		".jpg",
		".jpeg",
		".tiff",
		".tif",
		".heic",
		".heif",
		".webp",
		".png",
	],
	options: [],
	execute: async (input, _options, context) => {
		const exifr = await import("exifr");

		context.onProgress?.(10);

		const raw = await exifr.default.parse(input, {
			translateKeys: true,
			translateValues: true,
			reviveValues: true,
			tiff: true,
			xmp: true,
			icc: true,
			iptc: true,
			jfif: true,
			ihdr: true,
			gps: true,
			exif: true,
			interop: true,
		});

		context.onProgress?.(80);

		const metadata = raw ?? {};
		const json = JSON.stringify(metadata, null, 2);
		const output = new TextEncoder().encode(json);

		context.onProgress?.(100);

		return {
			output,
			extension: ".json",
			mimeType: "application/json",
			metadata: {
				fieldCount: Object.keys(metadata).length,
				hasGps: !!(metadata.latitude || metadata.longitude),
			},
		};
	},
};

const exifStrip: ToolDefinition = {
	id: "exif-strip",
	name: "EXIF Metadata Stripper",
	category: "image",
	description:
		"Remove all EXIF metadata from images by re-encoding. Preserves visual quality.",
	inputMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/tiff"],
	inputExtensions: [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"],
	options: [
		{
			name: "format",
			type: "string",
			description:
				"Output format (defaults to jpg for JPEG input, png otherwise)",
			choices: ["jpg", "png", "webp"],
		},
		{
			name: "quality",
			type: "number",
			description: "Output quality for lossy formats (1-100)",
			default: 95,
			min: 1,
			max: 100,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for metadata stripping");
		}
		const { imageBackend, onProgress } = context;

		// Detect input format from magic bytes for default output format
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

		const outputFormat = (options.format as string) ?? detectedFormat;
		const quality = (options.quality as number) ?? 95;

		onProgress?.(10);

		// Round-trip decode → encode strips all metadata
		const decoded = await imageBackend.decode(input, "auto");
		onProgress?.(50);

		const output = await imageBackend.encode(decoded, {
			format: outputFormat,
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
			extension: extMap[outputFormat] ?? ".png",
			mimeType: mimeMap[outputFormat] ?? "image/png",
			metadata: {
				originalSize: input.byteLength,
				strippedSize: output.byteLength,
			},
		};
	},
};

registerTool(exifView);
registerTool(exifStrip);

export { exifStrip, exifView };
