export type OutputFormat = "image/jpeg" | "image/webp" | "image/png" | "same";

export interface CompressImageOptions {
	quality: number; // 0.0 to 1.0
	outputFormat?: OutputFormat;
	/** Signal to abort the compression (terminates worker immediately). */
	signal?: AbortSignal;
}

export interface CompressImageResult {
	blob: Blob;
	width: number;
	height: number;
}

function compressImageInWorker(
	blob: Blob,
	quality: number,
	outputFormat: string,
	signal?: AbortSignal,
): Promise<CompressImageResult> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("./compress-image.worker.ts", import.meta.url),
			{ type: "module" },
		);

		const onAbort = () => {
			worker.terminate();
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal?.addEventListener("abort", onAbort, { once: true });

		worker.onmessage = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			if (e.data.error) {
				reject(new Error(e.data.error));
			} else {
				resolve({
					blob: e.data.blob,
					width: e.data.width,
					height: e.data.height,
				});
			}
		};
		worker.onerror = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			reject(new Error(e.message || "Image compression worker failed"));
		};
		worker.postMessage({
			blob,
			quality,
			outputFormat,
			inputMime: blob.type,
		});
	});
}

export async function compressImage(
	input: Blob,
	options: CompressImageOptions = { quality: 0.8 },
): Promise<CompressImageResult> {
	const { quality, outputFormat = "same", signal } = options;
	return compressImageInWorker(input, quality, outputFormat, signal);
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
