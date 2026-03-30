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
} from "@nouploads/core";
export {
	convert,
	findToolByFormats,
	getAllTools,
	getTool,
	getToolsByCategory,
} from "@nouploads/core";

import { createSharpBackend } from "@nouploads/backend-sharp";
import type { ToolContext } from "@nouploads/core";
// Convenience: pre-configured convert that uses sharp backend
import { convert as coreConvert } from "@nouploads/core";

const defaultBackend = createSharpBackend();

/**
 * Convert a file using the sharp (libvips) backend.
 *
 * Usage:
 *   import { convertFile } from "nouploads";
 *   const result = await convertFile(inputBytes, { from: "heic", to: "jpg", quality: 80 });
 */
export async function convertFile(
	input: Uint8Array,
	options: { from: string; to: string; [key: string]: unknown },
	context?: Partial<ToolContext>,
) {
	return coreConvert(input, options, {
		imageBackend: defaultBackend,
		...context,
	});
}
