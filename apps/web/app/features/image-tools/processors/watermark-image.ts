export interface WatermarkImageOptions {
	text: string;
	fontSize: number;
	opacity: number;
	rotation: number;
	color: string;
	mode: "center" | "tiled";
	outputFormat?: string;
	quality?: number;
	signal?: AbortSignal;
}

export interface WatermarkImageResult {
	blob: Blob;
	width: number;
	height: number;
}

/**
 * Add a text watermark to an image using a Web Worker with OffscreenCanvas.
 * Supports AbortSignal to terminate the worker early.
 */
export async function watermarkImage(
	input: File,
	options: WatermarkImageOptions,
): Promise<WatermarkImageResult> {
	const {
		text,
		fontSize,
		opacity,
		rotation,
		color,
		mode,
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
			new URL("./watermark-image.worker.ts", import.meta.url),
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
			reject(new Error(e.message || "Watermark worker failed"));
		};

		worker.postMessage({
			blob: input,
			text,
			fontSize,
			opacity,
			rotation,
			color,
			mode,
			outputFormat,
			quality,
		});
	});
}
