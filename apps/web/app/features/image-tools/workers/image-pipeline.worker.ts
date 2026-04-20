/**
 * Generic image-tool pipeline worker. Loads a core image tool by ID,
 * creates a canvas-backed ImageBackend, and runs the tool's execute()
 * on the given input.
 *
 * One worker per request; terminated after a single response. This
 * keeps the main thread free while keeping core's ImageBackend
 * abstraction clean (decode/encode happen inside the worker via
 * OffscreenCanvas; no postMessage overhead per pixel op).
 *
 * Message in:
 *   { toolId: string; input: Uint8Array; options: Record<string, unknown> }
 * Message out (success):
 *   { output: Uint8Array; extension: string; mimeType: string; metadata? }
 * Message out (error):
 *   { error: string }
 */

import { createCanvasBackend } from "@nouploads/backend-canvas";
import type { ToolDefinition } from "@nouploads/core";
import { isToolResultMulti } from "@nouploads/core";

export interface PipelineRequest {
	toolId: string;
	input: Uint8Array;
	options: Record<string, unknown>;
}

export interface PipelineSuccess {
	output: Uint8Array;
	extension: string;
	mimeType: string;
	metadata?: Record<string, unknown>;
}

export interface PipelineError {
	error: string;
}

type PipelineResponse = PipelineSuccess | PipelineError;

/**
 * Dynamic import of the tool by ID. We list the image-tool IDs we
 * support explicitly so the bundler can code-split each entry.
 */
async function loadTool(toolId: string): Promise<ToolDefinition> {
	switch (toolId) {
		case "rotate-image":
			return (await import("@nouploads/core/tools/rotate-image")).default;
		case "resize-image":
			return (await import("@nouploads/core/tools/resize-image")).default;
		case "crop-image":
			return (await import("@nouploads/core/tools/crop-image")).default;
		case "strip-metadata":
			return (await import("@nouploads/core/tools/strip-metadata")).default;
		case "watermark-image":
			return (await import("@nouploads/core/tools/watermark-image")).default;
		case "compress-image":
			return (await import("@nouploads/core/tools/compress-image")).default;
		case "image-filters":
			return (await import("@nouploads/core/tools/image-filters")).default;
		case "favicon-generator":
			return (await import("@nouploads/core/tools/favicon-generator")).default;
		case "color-palette":
			return (await import("@nouploads/core/tools/color-palette")).default;
		case "images-to-pdf":
			return (await import("@nouploads/core/tools/images-to-pdf")).default;
		case "exif":
			return (await import("@nouploads/core/tools/exif")).exifView;
		case "heic-to-jpg":
			return (await import("@nouploads/core/tools/heic-to-jpg")).default;
		case "heic-to-png":
			return (await import("@nouploads/core/tools/heic-to-png")).default;
		case "heic-to-webp":
			return (await import("@nouploads/core/tools/heic-to-webp")).default;
		default:
			throw new Error(`Unknown image-tool ID in pipeline worker: ${toolId}`);
	}
}

self.onmessage = async (e: MessageEvent<PipelineRequest>) => {
	try {
		const { toolId, input, options } = e.data;
		const tool = await loadTool(toolId);
		const backend = createCanvasBackend();
		const result = await tool.execute(input, options, {
			imageBackend: backend,
		});
		if (isToolResultMulti(result)) {
			throw new Error(
				`Pipeline worker received ToolResultMulti from ${toolId}; use a different handler for multi-output tools.`,
			);
		}
		const response: PipelineSuccess = {
			output: result.output,
			extension: result.extension,
			mimeType: result.mimeType,
			metadata: result.metadata,
		};
		self.postMessage(response);
	} catch (err) {
		const response: PipelineError = {
			error: err instanceof Error ? err.message : String(err),
		};
		self.postMessage(response);
	}
};
