import type { RotateAction } from "./rotate-image.worker";

export type { RotateAction };

export interface RotateImageOptions {
	action: RotateAction;
	outputFormat?: "image/jpeg" | "image/png" | "image/webp";
	quality?: number;
	signal?: AbortSignal;
}

export interface RotateImageResult {
	blob: Blob;
	width: number;
	height: number;
}

/**
 * Rotate or flip an image using a Web Worker with OffscreenCanvas.
 * Supports AbortSignal to terminate the worker early.
 */
export async function rotateImage(
	input: File | Blob,
	options: RotateImageOptions,
): Promise<RotateImageResult> {
	const {
		action,
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
			new URL("./rotate-image.worker.ts", import.meta.url),
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
			reject(new Error(e.message || "Rotate worker failed"));
		};

		worker.postMessage({
			blob: input,
			action,
			outputFormat,
			quality,
		});
	});
}
