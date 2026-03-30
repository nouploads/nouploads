export interface ImageFiltersOptions {
	brightness?: number;
	contrast?: number;
	saturation?: number;
	blur?: number;
	hueRotate?: number;
	grayscale?: number;
	sepia?: number;
	invert?: number;
	outputFormat?: string;
	quality?: number;
	signal?: AbortSignal;
}

export interface ImageFiltersResult {
	blob: Blob;
	width: number;
	height: number;
}

/**
 * Apply CSS filters to an image using a Web Worker
 * with OffscreenCanvas. Supports AbortSignal to terminate
 * the worker early.
 */
export async function applyImageFilters(
	input: File | Blob,
	options: ImageFiltersOptions,
): Promise<ImageFiltersResult> {
	const {
		brightness = 100,
		contrast = 100,
		saturation = 100,
		blur = 0,
		hueRotate = 0,
		grayscale = 0,
		sepia = 0,
		invert = 0,
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
			new URL("./image-filters.worker.ts", import.meta.url),
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
			reject(new Error(e.message || "Image filters worker failed"));
		};

		worker.postMessage({
			blob: input,
			brightness,
			contrast,
			saturation,
			blur,
			hueRotate,
			grayscale,
			sepia,
			invert,
			outputFormat,
			quality,
		});
	});
}
