export interface ResizeImageOptions {
	width: number;
	height: number;
	outputFormat?: "image/jpeg" | "image/png" | "image/webp";
	quality?: number;
	signal?: AbortSignal;
}

export interface ResizeImageResult {
	blob: Blob;
	width: number;
	height: number;
}

/**
 * Get the natural dimensions of an image file.
 */
export async function getImageDimensions(
	file: File,
): Promise<{ width: number; height: number }> {
	const bitmap = await createImageBitmap(file);
	const { width, height } = bitmap;
	bitmap.close();
	return { width, height };
}

/**
 * Resize an image to the specified dimensions using a Web Worker with OffscreenCanvas.
 * Supports AbortSignal to terminate the worker early.
 */
export async function resizeImage(
	input: File,
	options: ResizeImageOptions,
): Promise<ResizeImageResult> {
	const {
		width,
		height,
		outputFormat = "image/png",
		quality = 0.92,
		signal,
	} = options;

	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("./resize-image.worker.ts", import.meta.url),
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
			reject(new Error(e.message || "Resize worker failed"));
		};

		worker.postMessage({ blob: input, width, height, outputFormat, quality });
	});
}
