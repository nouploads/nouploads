import {
	FORMAT_TO_EXTENSION,
	FORMAT_TO_MIME,
	INPUT_FORMATS,
} from "../format-maps.js";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export interface ImageConversionConfig {
	from: string;
	to: string;
	/** Override the auto-generated tool name */
	name?: string;
	/** Override the auto-generated description */
	description?: string;
	/** Default quality for lossy outputs (1-100). Defaults to 80. */
	defaultQuality?: number;
}

/**
 * Factory that generates and registers a ToolDefinition for an image format conversion.
 * All conversions delegate to imageBackend.transcode() (or decode+encode fallback).
 */
export function createImageConversionTool(
	config: ImageConversionConfig,
): ToolDefinition {
	const { from, to } = config;
	const fromUpper = from.toUpperCase();
	const toUpper = to.toUpperCase();

	const inputFormat = INPUT_FORMATS[from];
	if (!inputFormat) {
		throw new Error(
			`Unknown input format "${from}". Add it to INPUT_FORMATS in format-maps.ts`,
		);
	}

	const outputMime = FORMAT_TO_MIME[to];
	const outputExt = FORMAT_TO_EXTENSION[to];
	if (!outputMime || !outputExt) {
		throw new Error(
			`Unknown output format "${to}". Add it to FORMAT_TO_MIME/FORMAT_TO_EXTENSION in format-maps.ts`,
		);
	}

	const isLossy = ["jpg", "jpeg", "webp", "avif"].includes(to.toLowerCase());
	const defaultQuality = config.defaultQuality ?? 80;

	const tool: ToolDefinition = {
		id: `${from}-to-${to}`,
		name: config.name ?? `${fromUpper} to ${toUpper} Converter`,
		category: "image",
		description:
			config.description ?? `Convert ${fromUpper} images to ${toUpper} format.`,
		from,
		to,
		inputMimeTypes: inputFormat.mimeTypes,
		inputExtensions: inputFormat.extensions,
		options: isLossy
			? [
					{
						name: "quality",
						type: "number",
						description: `${toUpper} quality (1-100, higher = better quality, larger file)`,
						default: defaultQuality,
						min: 1,
						max: 100,
					},
				]
			: [],
		execute: async (input, options, context) => {
			if (!context.imageBackend) {
				throw new Error(
					`Image backend required for ${fromUpper} to ${toUpper} conversion`,
				);
			}
			const { imageBackend, onProgress } = context;
			const quality = isLossy
				? ((options.quality as number) ?? defaultQuality)
				: undefined;

			onProgress?.(10);

			// Try direct transcoding first (more efficient)
			if (imageBackend.transcode) {
				const result = await imageBackend.transcode(input, from, to, {
					format: to,
					quality,
				});
				onProgress?.(100);
				return { output: result, extension: outputExt, mimeType: outputMime };
			}

			// Fallback: decode → encode
			const decoded = await imageBackend.decode(input, from);
			onProgress?.(50);
			const encoded = await imageBackend.encode(decoded, {
				format: to,
				quality,
			});
			onProgress?.(100);

			return { output: encoded, extension: outputExt, mimeType: outputMime };
		},
	};

	registerTool(tool);
	return tool;
}
