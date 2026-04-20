/**
 * Crop image — web adapter. Runs @nouploads/core/tools/crop-image in the
 * image-pipeline worker with a canvas-backed ImageBackend.
 */
import type {} from "@nouploads/core/tools/crop-image";
import { runInPipeline } from "../lib/run-in-pipeline";

export interface CropRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface CropImageOptions {
	crop: CropRegion;
	outputFormat?: "image/jpeg" | "image/png" | "image/webp";
	quality?: number;
	signal?: AbortSignal;
}

export interface CropImageResult {
	blob: Blob;
	width: number;
	height: number;
}

const MIME_TO_CORE_FORMAT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export async function cropImage(
	input: File,
	options: CropImageOptions,
): Promise<CropImageResult> {
	const { crop, outputFormat = "image/png", quality = 0.92, signal } = options;
	const bytes = new Uint8Array(await input.arrayBuffer());
	const result = await runInPipeline({
		toolId: "crop-image",
		input: bytes,
		options: {
			x: crop.x,
			y: crop.y,
			width: crop.width,
			height: crop.height,
			format: MIME_TO_CORE_FORMAT[outputFormat] ?? "png",
			quality: Math.round(quality * 100),
		},
		signal,
	});

	return {
		blob: new Blob([result.output as BlobPart], { type: result.mimeType }),
		width: crop.width,
		height: crop.height,
	};
}
