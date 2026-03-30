import type { DecodedImage, DecoderFn } from "../decoders/types";

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

/* ------------------------------------------------------------------ */
/*  Pixel-level decoder registry for non-browser-native formats       */
/* ------------------------------------------------------------------ */

/**
 * Lazy-loaded decoders for formats that `createImageBitmap` cannot handle.
 * Each value is a thunk that dynamically imports the decoder module,
 * so the heavy library code is only fetched when a matching file is dropped.
 *
 * Keys are MIME types (use `inferMime()` to resolve extension-based types).
 */
const PIXEL_DECODERS: Record<string, () => Promise<DecoderFn>> = {
	"image/tiff": () =>
		import("../decoders/decode-tiff").then((m) => m.decodeTiff),
	"image/x-icon": () =>
		import("../decoders/decode-ico").then((m) => m.decodeIco),
	"image/jxl": () => import("../decoders/decode-jxl").then((m) => m.decodeJxl),
	"image/vnd.adobe.photoshop": () =>
		import("../decoders/decode-psd").then((m) => m.decodePsd),
	"image/x-tga": () =>
		import("../decoders/decode-tga").then((m) => m.decodeTga),
	"image/vnd.radiance": () =>
		import("../decoders/decode-hdr").then((m) => m.decodeHdr),
	"image/x-exr": () =>
		import("../decoders/decode-exr").then((m) => m.decodeExr),
	"image/vnd-ms.dds": () =>
		import("../decoders/decode-dds").then((m) => m.decodeDds),
	"image/x-pcx": () =>
		import("../decoders/decode-pcx").then((m) => m.decodePcx),
	"image/x-portable-bitmap": () =>
		import("../decoders/decode-netpbm").then((m) => m.decodeNetpbm),
	"image/x-portable-graymap": () =>
		import("../decoders/decode-netpbm").then((m) => m.decodeNetpbm),
	"image/x-portable-pixmap": () =>
		import("../decoders/decode-netpbm").then((m) => m.decodeNetpbm),
	"image/x-portable-anymap": () =>
		import("../decoders/decode-netpbm").then((m) => m.decodeNetpbm),
	"image/x-portable-arbitrarymap": () =>
		import("../decoders/decode-netpbm").then((m) => m.decodeNetpbm),
	"image/x-portable-floatmap": () =>
		import("../decoders/decode-netpbm").then((m) => m.decodeNetpbm),
	"image/fits": () =>
		import("../decoders/decode-fits").then((m) => m.decodeFits),
	"application/dicom": () =>
		import("../decoders/decode-dicom").then((m) => m.decodeDicom),
	"image/x-canon-cr2": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-canon-cr3": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-canon-crw": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-nikon-nef": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-nikon-nrw": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-sony-arw": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-sony-sr2": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-samsung-srw": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-adobe-dng": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-fuji-raf": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-olympus-orf": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-pentax-pef": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-epson-erf": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-panasonic-rw2": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-minolta-mrw": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-mamiya-mef": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-leaf-mos": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-kodak-kdc": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-kodak-dcr": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-sigma-x3f": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-hasselblad-3fr": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
	"image/x-raw": () =>
		import("../decoders/decode-raw").then((m) => m.decodeRaw),
};

/**
 * Map from file extension to MIME type for exotic formats where
 * the browser reports `File.type` as empty or `application/octet-stream`.
 */
const EXTENSION_TO_MIME: Record<string, string> = {
	// Mainstream (some browsers already set MIME, but just in case)
	tiff: "image/tiff",
	tif: "image/tiff",
	jxl: "image/jxl",
	ico: "image/x-icon",
	cur: "image/x-icon",
	// Niche — added as decoders are implemented
	psd: "image/vnd.adobe.photoshop",
	exr: "image/x-exr",
	hdr: "image/vnd.radiance",
	tga: "image/x-tga",
	dds: "image/vnd-ms.dds",
	pcx: "image/x-pcx",
	pbm: "image/x-portable-bitmap",
	pgm: "image/x-portable-graymap",
	ppm: "image/x-portable-pixmap",
	pnm: "image/x-portable-anymap",
	pam: "image/x-portable-arbitrarymap",
	pfm: "image/x-portable-floatmap",
	xcf: "image/x-xcf",
	dcm: "application/dicom",
	fits: "image/fits",
	fts: "image/fits",
	fit: "image/fits",
	jp2: "image/jp2",
	// Camera RAW
	cr2: "image/x-canon-cr2",
	cr3: "image/x-canon-cr3",
	crw: "image/x-canon-crw",
	nef: "image/x-nikon-nef",
	nrw: "image/x-nikon-nrw",
	arw: "image/x-sony-arw",
	sr2: "image/x-sony-sr2",
	srw: "image/x-samsung-srw",
	dng: "image/x-adobe-dng",
	raf: "image/x-fuji-raf",
	orf: "image/x-olympus-orf",
	pef: "image/x-pentax-pef",
	erf: "image/x-epson-erf",
	rw2: "image/x-panasonic-rw2",
	mrw: "image/x-minolta-mrw",
	mef: "image/x-mamiya-mef",
	mos: "image/x-leaf-mos",
	kdc: "image/x-kodak-kdc",
	dcr: "image/x-kodak-dcr",
	x3f: "image/x-sigma-x3f",
	"3fr": "image/x-hasselblad-3fr",
	raw: "image/x-raw",
};

/**
 * Infer MIME type from file extension when `File.type` is missing or generic.
 * Falls back to the original `File.type` if no mapping exists.
 */
export function inferMime(file: { name: string; type: string }): string {
	if (file.type && file.type !== "application/octet-stream") return file.type;
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	return EXTENSION_TO_MIME[ext] ?? file.type;
}

/**
 * Try to decode a file using a registered pixel-level decoder.
 * Returns `null` if no decoder is registered for the inferred MIME type
 * (meaning the file should go through the standard browser-native path).
 */
export async function decodeToPixels(
	input: Blob,
	mime: string,
	signal?: AbortSignal,
): Promise<DecodedImage | null> {
	const loaderThunk = PIXEL_DECODERS[mime];
	if (!loaderThunk) return null;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
	const decode = await loaderThunk();
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
	return decode(input, signal);
}

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
 * Non-AVIF conversion from raw RGBA pixels via a Web Worker.
 */
function convertPixelsInWorker(
	decoded: DecodedImage,
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
		worker.postMessage({
			pixelData: decoded.data,
			pixelWidth: decoded.width,
			pixelHeight: decoded.height,
			outputFormat,
			quality,
			backgroundColor,
		});
	});
}

/**
 * AVIF conversion from raw RGBA pixels: build ImageData, then encode in AVIF worker.
 */
async function convertAvifFromPixels(
	decoded: DecodedImage,
	quality: number,
	signal?: AbortSignal,
): Promise<ConvertImageResult> {
	const { data, width, height } = decoded;
	if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
		throw new Error(
			`Image dimensions ${width}×${height} exceed the maximum of ${MAX_DIMENSION}px`,
		);
	}
	const imageData = new ImageData(
		new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
		width,
		height,
	);
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
 * Convert an image to a different format.
 *
 * Accepts any browser-decodable image plus exotic formats with registered
 * pixel decoders. Outputs to JPG, PNG, WebP, or AVIF.
 * All heavy work runs in Web Workers.
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

	// 1. Try pixel-level decoder for exotic formats (TIFF, PSD, EXR, etc.)
	const mime = input instanceof File ? inferMime(input) : input.type;
	const pixels = await decodeToPixels(input, mime, signal);

	if (pixels) {
		// Exotic format decoded to raw RGBA — send pixels directly to worker
		if (outputFormat === "image/avif") {
			return convertAvifFromPixels(pixels, quality, signal);
		}
		return convertPixelsInWorker(
			pixels,
			outputFormat,
			quality,
			backgroundColor,
			signal,
		);
	}

	// 2. Standard path: HEIC pre-decode, then browser-native createImageBitmap
	const decoded = await ensureDecodable(input, signal);

	if (outputFormat === "image/avif") {
		return convertAvif(decoded, quality, backgroundColor, signal);
	}

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
