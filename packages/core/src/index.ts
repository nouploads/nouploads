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
	ToolResultMulti,
	ToolResultOutput,
} from "./tool.js";
export { isToolResultMulti } from "./tool.js";
export { createExoticDecoderTool } from "./tools/exotic-factory.js";
// Factory
export { createImageConversionTool } from "./tools/factory.js";

// Base64 utilities
export { decodeBase64, encodeBase64 } from "./util/base64.js";

// HIGH-LEVEL CONVENIENCE FUNCTION
//
// Note: this entry does NOT eagerly register any tools. Consumers who need
// the full registry (for `--list`, format-pair lookup, etc.) should import
// `@nouploads/core/load-all-tools` once at startup. Consumers who only
// need a specific tool should import `@nouploads/core/tools/<id>` — this
// tree-shakes cleanly.
import { findToolByFormats } from "./registry.js";
import type { ToolContext } from "./tool.js";

/**
 * Main entry point for programmatic usage of format-pair conversion.
 * Finds the right tool and runs it. Tools must be registered first —
 * either via `import "@nouploads/core/load-all-tools"` (eager, pulls all)
 * or via individual `import "@nouploads/core/tools/<id>"` imports
 * (tree-shakeable).
 *
 * Usage:
 *   import "@nouploads/core/load-all-tools";
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
		throw new Error(
			`No tool found for converting ${from} to ${to}. If you imported only specific tools, ensure the one you need is registered — or import "@nouploads/core/load-all-tools" to register everything.`,
		);
	}
	return tool.execute(input, rest, context);
}
