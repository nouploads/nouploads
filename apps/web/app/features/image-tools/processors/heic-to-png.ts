export interface HeicToPngOptions {
	/** Signal to abort the conversion. */
	signal?: AbortSignal;
}

/**
 * Decode a HEIC blob to PNG using heic2any on the main thread.
 *
 * heic2any requires DOM canvas (document.createElement("canvas")) so it
 * cannot run in a Web Worker. AbortSignal support is still provided —
 * if aborted, the result is discarded (heic2any itself is not cancellable,
 * but the caller won't receive stale results).
 */
export async function heicToPng(
	input: Blob,
	options: HeicToPngOptions = {},
): Promise<Blob> {
	if (options.signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const heic2any = (await import("heic2any")).default;

	if (options.signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const result = await heic2any({ blob: input, toType: "image/png" });
	const output = Array.isArray(result) ? result[0] : result;

	if (options.signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	return output;
}

/**
 * Batch convert multiple HEIC blobs to PNG.
 * Returns an array of results — each is either a Blob (success) or Error (failure).
 * Failed files don't stop the batch; other files continue converting.
 */
export async function heicToPngBatch(
	inputs: Blob[],
	options: HeicToPngOptions = {},
	onProgress?: (completedIndex: number, totalCount: number) => void,
): Promise<(Blob | Error)[]> {
	const results: (Blob | Error)[] = [];

	for (let i = 0; i < inputs.length; i++) {
		try {
			const output = await heicToPng(inputs[i], options);
			results.push(output);
		} catch (err) {
			results.push(err instanceof Error ? err : new Error(String(err)));
		}
		onProgress?.(i, inputs.length);
	}

	return results;
}
