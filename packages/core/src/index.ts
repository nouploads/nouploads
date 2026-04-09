// Types
export type {
	CropRegion,
	EncodeOptions,
	ImageBackend,
	ImageData,
	ResizeOptions,
} from "./backend.js";
// Decoder types
export type { DecoderFn } from "./decoders/types.js";
// Format maps
export {
	FORMAT_TO_EXTENSION,
	FORMAT_TO_MIME,
	INPUT_FORMATS,
} from "./format-maps.js";
// Registry
export {
	findToolByFormats,
	getAllTools,
	getTool,
	getToolsByCategory,
	registerTool,
} from "./registry.js";
export type {
	ToolContext,
	ToolDefinition,
	ToolExecuteFn,
	ToolExecuteMultiFn,
	ToolOption,
	ToolResult,
} from "./tool.js";
export { createExoticDecoderTool } from "./tools/exotic-factory.js";
// Factory
export { createImageConversionTool } from "./tools/factory.js";

// Base64 utilities
export { decodeBase64, encodeBase64 } from "./util/base64.js";

// --- Register all tools (import for side effects) ---
// IMAGE CONVERSION
import "./tools/heic-to-jpg.js";
import "./tools/standard-conversions.js";
// EXOTIC FORMAT CONVERSIONS
import "./tools/exotic-conversions.js";
// IMAGE MANIPULATION
import "./tools/compress-image.js";
import "./tools/resize-image.js";
import "./tools/crop-image.js";
import "./tools/rotate-image.js";
import "./tools/watermark-image.js";
// METADATA & PDF
import "./tools/exif.js";
import "./tools/strip-metadata.js";
import "./tools/images-to-pdf.js";
// BROWSER-ONLY STUBS + HEIC VARIANTS
import "./tools/browser-only-stubs.js";
// UTILITY TOOLS
import "./tools/optimize-svg.js";
import "./tools/merge-pdf.js";
import "./tools/watermark-pdf.js";
import "./tools/pdf-to-text.js";
import "./tools/rotate-pdf.js";
import "./tools/split-pdf.js";
import "./tools/reorder-pdf.js";
import "./tools/qr-code.js";
import "./tools/base64.js";
import "./tools/favicon-generator.js";
import "./tools/hash-generator.js";
import "./tools/json-formatter.js";
import "./tools/jwt-decoder.js";
import "./tools/page-numbers-pdf.js";
import "./tools/protect-pdf.js";
import "./tools/unlock-pdf.js";
import "./tools/image-filters.js";
import "./tools/regex-tester.js";
import "./tools/timestamp-converter.js";
import "./tools/uuid-generator.js";
import "./tools/url-encoder.js";
import "./tools/text-diff.js";
import "./tools/markdown-preview.js";
import "./tools/word-counter.js";
import "./tools/css-formatter.js";
import "./tools/color-palette.js";
import "./tools/json-csv.js";
import "./tools/case-converter.js";
import "./tools/yaml-json.js";
import "./tools/cron-parser.js";
import "./tools/lorem-ipsum.js";

// HIGH-LEVEL CONVENIENCE FUNCTION
import { findToolByFormats } from "./registry.js";
import type { ToolContext } from "./tool.js";

/**
 * Main entry point for programmatic usage.
 * Finds the right tool and runs it.
 *
 * Usage:
 *   const result = await convert(bytes, { from: 'heic', to: 'jpg', quality: 80 }, { imageBackend });
 */
export async function convert(
	input: Uint8Array,
	options: { from: string; to: string; [key: string]: unknown },
	context: ToolContext,
) {
	const { from, to, ...rest } = options;
	const tool = findToolByFormats(from, to);
	if (!tool) {
		throw new Error(`No tool found for converting ${from} to ${to}`);
	}
	return tool.execute(input, rest, context);
}
