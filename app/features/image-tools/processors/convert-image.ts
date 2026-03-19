export type ConvertOutputFormat =
	| "image/jpeg"
	| "image/png"
	| "image/webp"
	| "image/avif";

export interface ConvertImageOptions {
	outputFormat: ConvertOutputFormat;
	/** 0.0 to 1.0 — only applies to lossy formats (JPEG, WebP, AVIF). Ignored for PNG. */
	quality?: number;
	/** Background color (CSS hex string) for formats that don't support transparency. Defaults to "#ffffff". */
	backgroundColor?: string;
	/** Signal to abort the conversion (terminates AVIF worker immediately). */
	signal?: AbortSignal;
}

export interface ConvertImageResult {
	blob: Blob;
	width: number;
	height: number;
}

const MAX_DIMENSION = 16384;

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

/**
 * Decode HEIC/HEIF to a browser-readable Blob on the main thread.
 * Returns the input unchanged for non-HEIC formats.
 *
 * heic2any requires DOM canvas and cannot run in a Web Worker.
 * AbortSignal is checked between async steps to discard stale results.
 */
export async function ensureDecodable(
	input: Blob,
	signal?: AbortSignal,
): Promise<Blob> {
	if (!HEIC_TYPES.has(input.type)) return input;
	return decodeHeic(input, "image/png", 1, signal);
}

/**
 * Decode HEIC on the main thread using heic2any (requires DOM canvas).
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

/** Formats that do not support an alpha channel. */
const OPAQUE_FORMATS = new Set<ConvertOutputFormat>(["image/jpeg"]);

/**
 * Returns true if the given format cannot store transparency.
 */
export function formatRequiresBackground(format: ConvertOutputFormat): boolean {
	return OPAQUE_FORMATS.has(format);
}

/**
 * Detect whether a decoded image contains any non-opaque pixels.
 * Uses a small downscaled canvas (max 256px) for performance.
 */
export async function detectTransparency(input: Blob): Promise<boolean> {
	const decoded = await ensureDecodable(input, undefined);
	const bitmap = await createImageBitmap(decoded);

	// Downscale to max 256px for fast pixel scanning
	const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
	const w = Math.max(1, Math.round(bitmap.width * scale));
	const h = Math.max(1, Math.round(bitmap.height * scale));

	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		return false;
	}

	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close();

	const { data } = ctx.getImageData(0, 0, w, h);
	// Check every 4th byte (alpha channel) for non-opaque pixels
	for (let i = 3; i < data.length; i += 4) {
		if (data[i] < 255) return true;
	}
	return false;
}

/**
 * File extension (without dot) for a given output MIME type.
 */
export function extensionForFormat(format: ConvertOutputFormat): string {
	switch (format) {
		case "image/jpeg":
			return "jpg";
		case "image/png":
			return "png";
		case "image/webp":
			return "webp";
		case "image/avif":
			return "avif";
	}
}

/**
 * Run AVIF encoding in a Web Worker so the main thread stays responsive.
 * Supports AbortSignal to terminate the worker early when parameters change.
 */
function encodeAvifInWorker(
	imageData: ImageData,
	quality: number,
	signal?: AbortSignal,
): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("./avif-encode.worker.ts", import.meta.url),
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
				resolve(e.data.buffer);
			}
		};
		worker.onerror = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			reject(new Error(e.message || "AVIF encoding worker failed"));
		};
		worker.postMessage({ imageData, quality });
	});
}

/**
 * AVIF conversion: draw to main-thread canvas to get ImageData, then encode in AVIF worker.
 * Canvas drawImage is fast; the heavy WASM encode runs off-thread.
 */
async function convertAvif(
	decoded: Blob,
	quality: number,
	backgroundColor: string,
	signal?: AbortSignal,
): Promise<ConvertImageResult> {
	const bitmap = await createImageBitmap(decoded);
	const { width, height } = bitmap;

	if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
		bitmap.close();
		throw new Error(
			`Image dimensions ${width}×${height} exceed the maximum of ${MAX_DIMENSION}px`,
		);
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("Could not get canvas 2D context");
	}

	if (formatRequiresBackground("image/avif")) {
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width, height);
	}

	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();

	const imageData = ctx.getImageData(0, 0, width, height);
	const avifBuffer = await encodeAvifInWorker(
		imageData,
		Math.round(quality * 100),
		signal,
	);
	return {
		blob: new Blob([avifBuffer], { type: "image/avif" }),
		width,
		height,
	};
}

/**
 * Non-AVIF conversion in a Web Worker using OffscreenCanvas.
 */
function convertInWorker(
	blob: Blob,
	outputFormat: string,
	quality: number,
	backgroundColor: string,
	signal?: AbortSignal,
): Promise<ConvertImageResult> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("./convert-image.worker.ts", import.meta.url),
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
			reject(new Error(e.message || "Image conversion worker failed"));
		};
		worker.postMessage({ blob, outputFormat, quality, backgroundColor });
	});
}

/**
 * Convert an image to a different format.
 *
 * Accepts any browser-decodable image (JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, SVG, HEIC)
 * and outputs to JPG, PNG, WebP, or AVIF. All heavy work runs in Web Workers.
 */
export async function convertImage(
	input: Blob,
	options: ConvertImageOptions,
): Promise<ConvertImageResult> {
	const {
		outputFormat,
		quality = 0.92,
		backgroundColor = "#ffffff",
		signal,
	} = options;

	const decoded = await ensureDecodable(input, signal);

	// AVIF: use @jsquash/avif WASM encoder in a dedicated Web Worker
	if (outputFormat === "image/avif") {
		return convertAvif(decoded, quality, backgroundColor, signal);
	}

	// JPG/PNG/WebP: use OffscreenCanvas in a Web Worker
	return convertInWorker(
		decoded,
		outputFormat,
		quality,
		backgroundColor,
		signal,
	);
}

/**
 * Batch convert multiple images.
 * Returns an array of results — each is either a ConvertImageResult (success) or Error (failure).
 */
export async function convertImageBatch(
	inputs: Blob[],
	options: ConvertImageOptions,
	onProgress?: (completedIndex: number, totalCount: number) => void,
): Promise<(ConvertImageResult | Error)[]> {
	const results: (ConvertImageResult | Error)[] = [];

	for (let i = 0; i < inputs.length; i++) {
		try {
			const output = await convertImage(inputs[i], options);
			results.push(output);
		} catch (err) {
			results.push(err instanceof Error ? err : new Error(String(err)));
		}
		onProgress?.(i, inputs.length);
	}

	return results;
}
