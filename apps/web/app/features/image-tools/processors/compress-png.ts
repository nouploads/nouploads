/**
 * PNG compressor — web adapter. Runs @nouploads/core/tools/compress-png
 * in the image-pipeline worker. The canvas-backed ImageBackend exposes
 * image-q-based quantize, which is what delivers the actual size reduction.
 */
import type {} from "@nouploads/core/tools/compress-image";
import { runInPipeline } from "../lib/run-in-pipeline";

export interface CompressPngOptions {
	colors: number; // 2–256
	signal?: AbortSignal;
}

export interface CompressPngResult {
	blob: Blob;
	width: number;
	height: number;
}

export async function compressPng(
	input: Blob,
	options: CompressPngOptions = { colors: 256 },
): Promise<CompressPngResult> {
	const { colors, signal } = options;
	const bytes = new Uint8Array(await input.arrayBuffer());
	const result = await runInPipeline({
		toolId: "compress-png",
		input: bytes,
		options: { colors },
		signal,
	});
	return {
		blob: new Blob([result.output as BlobPart], { type: result.mimeType }),
		width: (result.metadata?.width as number) ?? 0,
		height: (result.metadata?.height as number) ?? 0,
	};
}

/**
 * Batch quantize multiple PNG images.
 * Returns an array of results — each is either a CompressPngResult (success) or Error (failure).
 */
export async function compressPngBatch(
	inputs: Blob[],
	options: CompressPngOptions = { colors: 256 },
	onProgress?: (completedIndex: number, totalCount: number) => void,
): Promise<(CompressPngResult | Error)[]> {
	const results: (CompressPngResult | Error)[] = [];

	for (let i = 0; i < inputs.length; i++) {
		try {
			const output = await compressPng(inputs[i], options);
			results.push(output);
		} catch (err) {
			results.push(err instanceof Error ? err : new Error(String(err)));
		}
		onProgress?.(i, inputs.length);
	}

	return results;
}
