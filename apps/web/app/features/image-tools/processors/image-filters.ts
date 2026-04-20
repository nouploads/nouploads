/**
 * Image filters — web adapter. Runs @nouploads/core/tools/image-filters
 * in the image-pipeline worker with a canvas-backed ImageBackend.
 */
import type {} from "@nouploads/core/tools/image-filters";
import { runInPipeline } from "../lib/run-in-pipeline";

export interface ImageFiltersOptions {
	brightness?: number;
	contrast?: number;
	saturation?: number;
	blur?: number;
	hueRotate?: number;
	grayscale?: number;
	sepia?: number;
	invert?: number;
	outputFormat?: string;
	quality?: number;
	signal?: AbortSignal;
}

export interface ImageFiltersResult {
	blob: Blob;
	width: number;
	height: number;
}

const MIME_TO_CORE_FORMAT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export async function applyImageFilters(
	input: File | Blob,
	options: ImageFiltersOptions,
): Promise<ImageFiltersResult> {
	const {
		brightness = 100,
		contrast = 100,
		saturation = 100,
		blur = 0,
		hueRotate = 0,
		grayscale = 0,
		sepia = 0,
		invert = 0,
		outputFormat = "image/png",
		quality = 0.92,
		signal,
	} = options;

	const bytes = new Uint8Array(await input.arrayBuffer());
	const result = await runInPipeline({
		toolId: "image-filters",
		input: bytes,
		options: {
			brightness,
			contrast,
			saturation,
			blur,
			hueRotate,
			grayscale,
			sepia,
			invert,
			format: MIME_TO_CORE_FORMAT[outputFormat] ?? "png",
			quality: Math.round(quality * 100),
		},
		signal,
	});

	return {
		blob: new Blob([result.output as BlobPart], { type: result.mimeType }),
		width: (result.metadata?.width as number) ?? 0,
		height: (result.metadata?.height as number) ?? 0,
	};
}
