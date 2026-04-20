// Type-only dependency on the core tool's registration — see notes on
// heic-to-jpg.ts for why heic2any stays main-thread in the web app.
import type {} from "@nouploads/core/tools/heic-to-webp";

export interface HeicToWebpOptions {
	quality: number; // 0.0 to 1.0
	/** Signal to abort the conversion. */
	signal?: AbortSignal;
}

/**
 * Decode a HEIC blob to WebP using heic2any on the main thread.
 *
 * heic2any requires DOM canvas (document.createElement("canvas")) so it
 * cannot run in a Web Worker. AbortSignal support is still provided —
 * if aborted, the result is discarded (heic2any itself is not cancellable,
 * but the caller won't receive stale results).
 */
export async function heicToWebp(
	input: Blob,
	options: HeicToWebpOptions = { quality: 0.82 },
): Promise<Blob> {
	if (options.signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const heic2any = (await import("heic2any")).default;

	if (options.signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const result = await heic2any({
		blob: input,
		toType: "image/webp",
		quality: options.quality,
	});
	const output = Array.isArray(result) ? result[0] : result;

	if (options.signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	return output;
}

/**
 * Batch convert multiple HEIC blobs to WebP.
 * Returns an array of results — each is either a Blob (success) or Error (failure).
 * Failed files don't stop the batch; other files continue converting.
 */
export async function heicToWebpBatch(
	inputs: Blob[],
	options: HeicToWebpOptions = { quality: 0.82 },
	onProgress?: (completedIndex: number, totalCount: number) => void,
): Promise<(Blob | Error)[]> {
	const results: (Blob | Error)[] = [];

	for (let i = 0; i < inputs.length; i++) {
		try {
			const output = await heicToWebp(inputs[i], options);
			results.push(output);
		} catch (err) {
			results.push(err instanceof Error ? err : new Error(String(err)));
		}
		onProgress?.(i, inputs.length);
	}

	return results;
}
