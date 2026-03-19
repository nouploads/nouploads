export interface HeicToJpgOptions {
	quality: number; // 0.0 to 1.0
	/** Signal to abort the conversion. */
	signal?: AbortSignal;
}

/**
 * Decode a HEIC blob using heic2any on the main thread.
 *
 * heic2any requires DOM canvas (document.createElement("canvas")) so it
 * cannot run in a Web Worker. AbortSignal support is still provided —
 * if aborted, the result is discarded (heic2any itself is not cancellable,
 * but the caller won't receive stale results).
 */
async function decodeHeic(
	blob: Blob,
	toType: string,
	quality: number,
	signal?: AbortSignal,
): Promise<Blob> {
	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const heic2any = (await import("heic2any")).default;

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const result = await heic2any({ blob, toType, quality });
	const output = Array.isArray(result) ? result[0] : result;

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	return output;
}

export async function heicToJpg(
	input: Blob,
	options: HeicToJpgOptions = { quality: 0.92 },
): Promise<Blob> {
	return decodeHeic(input, "image/jpeg", options.quality, options.signal);
}

/**
 * Batch convert multiple HEIC blobs to JPG.
 * Returns an array of results — each is either a Blob (success) or Error (failure).
 * Failed files don't stop the batch; other files continue converting.
 */
export async function heicToJpgBatch(
	inputs: Blob[],
	options: HeicToJpgOptions = { quality: 0.92 },
	onProgress?: (completedIndex: number, totalCount: number) => void,
): Promise<(Blob | Error)[]> {
	const results: (Blob | Error)[] = [];

	for (let i = 0; i < inputs.length; i++) {
		try {
			const output = await heicToJpg(inputs[i], options);
			results.push(output);
		} catch (err) {
			results.push(err instanceof Error ? err : new Error(String(err)));
		}
		onProgress?.(i, inputs.length);
	}

	return results;
}
