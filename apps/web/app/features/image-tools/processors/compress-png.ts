export interface CompressPngOptions {
	colors: number; // 2–256
	/** Signal to abort the compression (terminates worker immediately). */
	signal?: AbortSignal;
}

export interface CompressPngResult {
	blob: Blob;
	width: number;
	height: number;
}

function compressPngInWorker(
	blob: Blob,
	colors: number,
	signal?: AbortSignal,
): Promise<CompressPngResult> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("./compress-png.worker.ts", import.meta.url),
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
			reject(new Error(e.message || "PNG compression worker failed"));
		};
		worker.postMessage({ blob, colors });
	});
}

export async function compressPng(
	input: Blob,
	options: CompressPngOptions = { colors: 256 },
): Promise<CompressPngResult> {
	return compressPngInWorker(input, options.colors, options.signal);
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
