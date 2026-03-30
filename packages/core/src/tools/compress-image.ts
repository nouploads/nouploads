/**
 * Image compression tools: compress-jpg, compress-webp, compress-png.
 * JPG/WebP use lossy re-encoding at lower quality.
 * PNG uses color quantization (backend.quantize or image-q fallback).
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const compressJpg: ToolDefinition = {
	id: "compress-jpg",
	name: "Compress JPG",
	category: "image",
	description: "Compress JPG images by re-encoding at a lower quality setting.",
	inputMimeTypes: ["image/jpeg"],
	inputExtensions: [".jpg", ".jpeg"],
	options: [
		{
			name: "quality",
			type: "number",
			description: "Output quality (1-100, lower = smaller file)",
			default: 60,
			min: 1,
			max: 100,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for JPG compression");
		}
		const quality = (options.quality as number) ?? 60;
		context.onProgress?.(10);

		if (context.imageBackend.transcode) {
			const output = await context.imageBackend.transcode(
				input,
				"jpeg",
				"jpeg",
				{ format: "jpeg", quality },
			);
			context.onProgress?.(100);
			return { output, extension: ".jpg", mimeType: "image/jpeg" };
		}

		const decoded = await context.imageBackend.decode(input, "jpeg");
		context.onProgress?.(50);
		const output = await context.imageBackend.encode(decoded, {
			format: "jpeg",
			quality,
		});
		context.onProgress?.(100);
		return { output, extension: ".jpg", mimeType: "image/jpeg" };
	},
};

const compressWebp: ToolDefinition = {
	id: "compress-webp",
	name: "Compress WebP",
	category: "image",
	description:
		"Compress WebP images by re-encoding at a lower quality setting.",
	inputMimeTypes: ["image/webp"],
	inputExtensions: [".webp"],
	options: [
		{
			name: "quality",
			type: "number",
			description: "Output quality (1-100, lower = smaller file)",
			default: 60,
			min: 1,
			max: 100,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for WebP compression");
		}
		const quality = (options.quality as number) ?? 60;
		context.onProgress?.(10);

		if (context.imageBackend.transcode) {
			const output = await context.imageBackend.transcode(
				input,
				"webp",
				"webp",
				{ format: "webp", quality },
			);
			context.onProgress?.(100);
			return { output, extension: ".webp", mimeType: "image/webp" };
		}

		const decoded = await context.imageBackend.decode(input, "webp");
		context.onProgress?.(50);
		const output = await context.imageBackend.encode(decoded, {
			format: "webp",
			quality,
		});
		context.onProgress?.(100);
		return { output, extension: ".webp", mimeType: "image/webp" };
	},
};

const compressPng: ToolDefinition = {
	id: "compress-png",
	name: "Compress PNG",
	category: "image",
	description:
		"Compress PNG images by reducing the color palette (quantization).",
	inputMimeTypes: ["image/png"],
	inputExtensions: [".png"],
	options: [
		{
			name: "colors",
			type: "number",
			description: "Maximum number of colors in the palette (2-256)",
			default: 256,
			min: 2,
			max: 256,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for PNG compression");
		}
		const colors = (options.colors as number) ?? 256;
		context.onProgress?.(10);

		const decoded = await context.imageBackend.decode(input, "png");
		context.onProgress?.(30);

		// Use backend quantize if available, otherwise encode directly
		let imageToEncode = decoded;
		if (context.imageBackend.quantize) {
			imageToEncode = await context.imageBackend.quantize(decoded, colors);
		}
		context.onProgress?.(70);

		const output = await context.imageBackend.encode(imageToEncode, {
			format: "png",
		});
		context.onProgress?.(100);
		return { output, extension: ".png", mimeType: "image/png" };
	},
};

registerTool(compressJpg);
registerTool(compressWebp);
registerTool(compressPng);

export { compressJpg, compressPng, compressWebp };
