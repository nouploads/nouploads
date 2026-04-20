/**
 * Watermark image — web adapter. Runs
 * @nouploads/core/tools/watermark-image in the image-pipeline worker.
 */
import type {} from "@nouploads/core/tools/watermark-image";
import { runInPipeline } from "../lib/run-in-pipeline";

export interface WatermarkImageOptions {
	text: string;
	fontSize: number;
	opacity: number;
	rotation: number;
	color: string;
	mode: "center" | "tiled";
	outputFormat?: string;
	quality?: number;
	signal?: AbortSignal;
}

export interface WatermarkImageResult {
	blob: Blob;
	width: number;
	height: number;
}

const MIME_TO_CORE_FORMAT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export async function watermarkImage(
	input: File,
	options: WatermarkImageOptions,
): Promise<WatermarkImageResult> {
	const {
		text,
		fontSize,
		opacity,
		rotation,
		color,
		mode,
		outputFormat = "image/png",
		quality = 0.92,
		signal,
	} = options;

	const bytes = new Uint8Array(await input.arrayBuffer());
	const result = await runInPipeline({
		toolId: "watermark-image",
		input: bytes,
		options: {
			text,
			fontSize,
			opacity,
			rotation,
			color,
			mode,
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
