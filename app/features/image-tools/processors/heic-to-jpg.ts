export interface HeicToJpgOptions {
	quality: number; // 0.0 to 1.0
}

export async function heicToJpg(
	input: Blob,
	options: HeicToJpgOptions = { quality: 0.92 },
): Promise<Blob> {
	const heic2any = (await import("heic2any")).default;

	const result = await heic2any({
		blob: input,
		toType: "image/jpeg",
		quality: options.quality,
	});

	// heic2any can return a single Blob or an array of Blobs (for multi-image HEIC)
	if (Array.isArray(result)) {
		return result[0];
	}
	return result;
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
