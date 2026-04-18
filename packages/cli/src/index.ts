/**
 * Programmatic API entry point.
 * When someone does `import { convert } from "nouploads"` in their Node.js project,
 * they get this module which re-exports core with the sharp backend pre-wired.
 */

export { createSharpBackend } from "@nouploads/backend-sharp";
export type {
	ImageBackend,
	ToolContext,
	ToolDefinition,
	ToolOption,
	ToolResult,
	ToolResultMulti,
	ToolResultOutput,
} from "@nouploads/core";
export {
	convert,
	findToolByFormats,
	getAllTools,
	getTool,
	getToolsByCategory,
	isToolResultMulti,
} from "@nouploads/core";

import { createSharpBackend } from "@nouploads/backend-sharp";
// Convenience: pre-configured convert that uses sharp backend
import {
	convert as coreConvert,
	isToolResultMulti as coreIsToolResultMulti,
	type ToolContext,
	type ToolResult,
} from "@nouploads/core";

const defaultBackend = createSharpBackend();

/**
 * Convert a file using the sharp (libvips) backend.
 *
 * Format conversion is always single-output, so the result is narrowed to
 * `ToolResult`. For tools that produce multiple outputs (split-pdf,
 * parse-gif-frames, ...) use `getTool(id).execute(...)` directly and
 * narrow with `isToolResultMulti`.
 *
 * Usage:
 *   import { convertFile } from "nouploads";
 *   const result = await convertFile(inputBytes, { from: "heic", to: "jpg", quality: 80 });
 */
export async function convertFile(
	input: Uint8Array,
	options: { from: string; to: string; [key: string]: unknown },
	context?: Partial<ToolContext>,
): Promise<ToolResult> {
	const result = await coreConvert(input, options, {
		imageBackend: defaultBackend,
		...context,
	});
	if (coreIsToolResultMulti(result)) {
		throw new Error(
			`convertFile expected a single-output tool but ${options.from} → ${options.to} returned multiple outputs. Use getTool(...).execute(...) and isToolResultMulti() to handle multi-output tools.`,
		);
	}
	return result;
}
