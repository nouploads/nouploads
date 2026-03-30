export interface CropRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface CropImageOptions {
	crop: CropRegion;
	outputFormat?: "image/jpeg" | "image/png" | "image/webp";
	quality?: number;
	signal?: AbortSignal;
}

export interface CropImageResult {
	blob: Blob;
	width: number;
	height: number;
}

/**
 * Crop an image to the specified region using a Web Worker with OffscreenCanvas.
 * Supports AbortSignal to terminate the worker early.
 */
export async function cropImage(
	input: File,
	options: CropImageOptions,
): Promise<CropImageResult> {
	const { crop, outputFormat = "image/png", quality = 0.92, signal } = options;

	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("./crop-image.worker.ts", import.meta.url),
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
			reject(new Error(e.message || "Crop worker failed"));
		};

		worker.postMessage({
			blob: input,
			x: crop.x,
			y: crop.y,
			width: crop.width,
			height: crop.height,
			outputFormat,
			quality,
		});
	});
}
