/**
 * Resize image — web adapter. Runs @nouploads/core/tools/resize-image in
 * the image-pipeline worker with a canvas-backed ImageBackend.
 */
import type {} from "@nouploads/core/tools/resize-image";
import { runInPipeline } from "../lib/run-in-pipeline";

export interface ResizeImageOptions {
	width: number;
	height: number;
	outputFormat?: "image/jpeg" | "image/png" | "image/webp";
	quality?: number;
	signal?: AbortSignal;
}

export interface ResizeImageResult {
	blob: Blob;
	width: number;
	height: number;
}

const MIME_TO_CORE_FORMAT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

/** Get the natural dimensions of an image file (main-thread, fast). */
export async function getImageDimensions(
	file: File,
): Promise<{ width: number; height: number }> {
	const bitmap = await createImageBitmap(file);
	const { width, height } = bitmap;
	bitmap.close();
	return { width, height };
}

export async function resizeImage(
	input: File,
	options: ResizeImageOptions,
): Promise<ResizeImageResult> {
	const {
		width,
		height,
		outputFormat = "image/png",
		quality = 0.92,
		signal,
	} = options;

	const bytes = new Uint8Array(await input.arrayBuffer());
	const result = await runInPipeline({
		toolId: "resize-image",
		input: bytes,
		options: {
			width,
			height,
			format: MIME_TO_CORE_FORMAT[outputFormat] ?? "png",
			quality: Math.round(quality * 100),
		},
		signal,
	});

	return {
		blob: new Blob([result.output as BlobPart], { type: result.mimeType }),
		width: (result.metadata?.width as number) ?? width,
		height: (result.metadata?.height as number) ?? height,
	};
}
