/**
 * Image compressor — web adapter. Dispatches to
 * @nouploads/core/tools/compress-jpg | compress-webp | compress-png
 * via the image-pipeline worker with a canvas-backed ImageBackend.
 */
import type {} from "@nouploads/core/tools/compress-image";
import { runInPipeline } from "../lib/run-in-pipeline";

export type OutputFormat = "image/jpeg" | "image/webp" | "image/png" | "same";

export interface CompressImageOptions {
	quality: number; // 0.0 to 1.0
	outputFormat?: OutputFormat;
	signal?: AbortSignal;
}

export interface CompressImageResult {
	blob: Blob;
	width: number;
	height: number;
}

function resolveOutputMime(
	inputMime: string,
	outputFormat: OutputFormat,
): string {
	if (outputFormat !== "same") return outputFormat;
	if (
		inputMime === "image/jpeg" ||
		inputMime === "image/png" ||
		inputMime === "image/webp"
	) {
		return inputMime;
	}
	return "image/webp";
}

export async function compressImage(
	input: Blob,
	options: CompressImageOptions = { quality: 0.8 },
): Promise<CompressImageResult> {
	const { quality, outputFormat = "same", signal } = options;
	const mime = resolveOutputMime(input.type, outputFormat);

	let toolId: string;
	let pipelineOptions: Record<string, unknown>;

	if (mime === "image/jpeg") {
		toolId = "compress-jpg";
		pipelineOptions = { quality: Math.round(quality * 100) };
	} else if (mime === "image/webp") {
		toolId = "compress-webp";
		pipelineOptions = { quality: Math.round(quality * 100) };
	} else {
		toolId = "compress-png";
		pipelineOptions = { colors: 256 };
	}

	const bytes = new Uint8Array(await input.arrayBuffer());
	const result = await runInPipeline({
		toolId,
		input: bytes,
		options: pipelineOptions,
		signal,
	});

	// Core compress-jpg/webp/png doesn't surface dimensions in metadata
	// yet; decode for natural sizes is unnecessary for compression UIs.
	return {
		blob: new Blob([result.output as BlobPart], { type: result.mimeType }),
		width: (result.metadata?.width as number) ?? 0,
		height: (result.metadata?.height as number) ?? 0,
	};
}

/**
 * Batch compress multiple images.
 * Returns an array of results — each is either a CompressImageResult (success) or Error (failure).
 * Failed files don't stop the batch; other files continue processing.
 */
export async function compressImageBatch(
	inputs: Blob[],
	options: CompressImageOptions = { quality: 0.8 },
	onProgress?: (completedIndex: number, totalCount: number) => void,
): Promise<(CompressImageResult | Error)[]> {
	const results: (CompressImageResult | Error)[] = [];

	for (let i = 0; i < inputs.length; i++) {
		try {
			const output = await compressImage(inputs[i], options);
			results.push(output);
		} catch (err) {
			results.push(err instanceof Error ? err : new Error(String(err)));
		}
		onProgress?.(i, inputs.length);
	}

	return results;
}
