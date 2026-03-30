/**
 * Factory for creating tools that use a custom pixel decoder + ImageBackend.encode().
 * Used for exotic formats (PSD, TGA, HDR, etc.) that sharp may not support natively.
 *
 * Flow: input bytes → decoder → RGBA pixels → imageBackend.encode() → output bytes
 */

import type { DecoderFn } from "../decoders/types.js";
import { FORMAT_TO_EXTENSION, FORMAT_TO_MIME } from "../format-maps.js";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export interface ExoticConversionConfig {
	from: string;
	to: string;
	inputMimeTypes: string[];
	inputExtensions: string[];
	/** Thunk that returns the decoder (for lazy loading) */
	decoder: () => Promise<DecoderFn>;
	name?: string;
	description?: string;
	defaultQuality?: number;
}

export function createExoticDecoderTool(
	config: ExoticConversionConfig,
): ToolDefinition {
	const { from, to } = config;
	const fromUpper = from.toUpperCase();
	const toUpper = to.toUpperCase();

	const outputMime = FORMAT_TO_MIME[to];
	const outputExt = FORMAT_TO_EXTENSION[to];
	if (!outputMime || !outputExt) {
		throw new Error(`Unknown output format "${to}" in exotic factory`);
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
		inputMimeTypes: config.inputMimeTypes,
		inputExtensions: config.inputExtensions,
		options: isLossy
			? [
					{
						name: "quality",
						type: "number",
						description: `${toUpper} quality (1-100)`,
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

			// First try: let the backend handle it directly via transcode
			// (sharp supports many formats natively: TIFF, GIF, SVG, etc.)
			if (imageBackend.transcode) {
				try {
					const result = await imageBackend.transcode(input, from, to, {
						format: to,
						quality,
					});
					onProgress?.(100);
					return {
						output: result,
						extension: outputExt,
						mimeType: outputMime,
					};
				} catch {
					// Backend couldn't handle this format, fall through to decoder
				}
			}

			// Fallback: use the JS decoder → RGBA pixels → backend.encode()
			const decode = await config.decoder();
			const decoded = await decode(input);
			onProgress?.(60);

			const output = await imageBackend.encode(decoded, {
				format: to,
				quality,
			});
			onProgress?.(100);

			return { output, extension: outputExt, mimeType: outputMime };
		},
	};

	registerTool(tool);
	return tool;
}
