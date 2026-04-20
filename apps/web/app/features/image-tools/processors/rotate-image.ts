/**
 * Rotate/flip image — web adapter. Sends the work to the image-pipeline
 * worker which runs @nouploads/core/tools/rotate-image with a
 * canvas-backed ImageBackend inside the worker. The main thread stays
 * free during large decodes/encodes.
 */
// Type-only import — keeps the bundle clean (no tool code on main thread)
// but documents the runtime dependency on core's rotate-image tool.
import type {} from "@nouploads/core/tools/rotate-image";
import { runInPipeline } from "../lib/run-in-pipeline";

export type RotateAction =
	| "rotate-cw"
	| "rotate-ccw"
	| "rotate-180"
	| "flip-h"
	| "flip-v";

export interface RotateImageOptions {
	action: RotateAction;
	outputFormat?: "image/jpeg" | "image/png" | "image/webp";
	quality?: number;
	signal?: AbortSignal;
}

export interface RotateImageResult {
	blob: Blob;
	width: number;
	height: number;
}

const MIME_TO_CORE_FORMAT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export async function rotateImage(
	input: File | Blob,
	options: RotateImageOptions,
): Promise<RotateImageResult> {
	const {
		action,
		outputFormat = "image/png",
		quality = 0.92,
		signal,
	} = options;

	const bytes = new Uint8Array(await input.arrayBuffer());
	const coreFormat = MIME_TO_CORE_FORMAT[outputFormat] ?? "png";
	// Core quality is 1-100, web passes 0-1 for canvas toBlob
	const coreQuality = Math.round(quality * 100);

	const result = await runInPipeline({
		toolId: "rotate-image",
		input: bytes,
		options: {
			action,
			format: coreFormat,
			quality: coreQuality,
		},
		signal,
	});

	const blob = new Blob([result.output as BlobPart], {
		type: result.mimeType,
	});
	const newWidth = (result.metadata?.newWidth as number) ?? 0;
	const newHeight = (result.metadata?.newHeight as number) ?? 0;

	return { blob, width: newWidth, height: newHeight };
}
