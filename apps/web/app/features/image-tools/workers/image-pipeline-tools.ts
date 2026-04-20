/**
 * Shared tool-id → loader map for the image-pipeline worker. Lives in
 * its own module (rather than inline in the worker) so the
 * drift test can enumerate the supported IDs without spinning up a
 * Web Worker or depending on OffscreenCanvas.
 *
 * Adding a new image tool to @nouploads/core requires one of:
 *   (a) add a loader here AND ensure the drift test stays green, or
 *   (b) add the ID to IMAGE_TOOLS_NOT_IN_PIPELINE in the drift test
 *       (apps/web/tests/unit/image-pipeline-drift.test.ts) with a
 *       one-line reason for the exception.
 */
import type { ToolDefinition } from "@nouploads/core";

export type PipelineToolLoader = () => Promise<ToolDefinition>;

export const PIPELINE_TOOL_LOADERS: Record<string, PipelineToolLoader> = {
	"rotate-image": async () =>
		(await import("@nouploads/core/tools/rotate-image")).default,
	"resize-image": async () =>
		(await import("@nouploads/core/tools/resize-image")).default,
	"crop-image": async () =>
		(await import("@nouploads/core/tools/crop-image")).default,
	"strip-metadata": async () => {
		const mod = await import("@nouploads/core/tools/strip-metadata");
		return mod.stripMetadata as unknown as ToolDefinition;
	},
	"watermark-image": async () =>
		(await import("@nouploads/core/tools/watermark-image")).default,
	"compress-jpg": async () => {
		const mod = await import("@nouploads/core/tools/compress-image");
		return mod.compressJpg as unknown as ToolDefinition;
	},
	"compress-webp": async () => {
		const mod = await import("@nouploads/core/tools/compress-image");
		return mod.compressWebp as unknown as ToolDefinition;
	},
	"compress-png": async () => {
		const mod = await import("@nouploads/core/tools/compress-image");
		return mod.compressPng as unknown as ToolDefinition;
	},
	"image-filters": async () =>
		(await import("@nouploads/core/tools/image-filters")).default,
	"favicon-generator": async () =>
		(await import("@nouploads/core/tools/favicon-generator")).default,
	"color-palette": async () => {
		const mod = await import("@nouploads/core/tools/color-palette");
		return mod.colorPalette as unknown as ToolDefinition;
	},
	"images-to-pdf": async () =>
		(await import("@nouploads/core/tools/images-to-pdf")).default,
};

export const IMAGE_PIPELINE_TOOL_IDS: readonly string[] = Object.freeze(
	Object.keys(PIPELINE_TOOL_LOADERS),
);

export async function loadPipelineTool(
	toolId: string,
): Promise<ToolDefinition> {
	const loader = PIPELINE_TOOL_LOADERS[toolId];
	if (!loader) {
		throw new Error(`Unknown image-tool ID in pipeline worker: ${toolId}`);
	}
	return loader();
}
