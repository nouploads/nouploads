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
	/** Target rasterization width for vector inputs (SVG). Aspect ratio is preserved. */
	targetWidth?: number;
	/** Target rasterization height for vector inputs (SVG). Aspect ratio is preserved. */
	targetHeight?: number;
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
	"image/jp2": () => import("../decoders/decode-jp2").then((m) => m.decodeJp2),
	"image/vnd.adobe.photoshop": () =>
		import("../decoders/decode-psd").then((m) => m.decodePsd),
	"image/vnd.adobe.photoshop-large": () =>
		import("../decoders/decode-psb").then((m) => m.decodePsb),
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
	"image/x-sgi": () =>
		import("../decoders/decode-sgi").then((m) => m.decodeSgi),
	"image/x-sun-raster": () =>
		import("../decoders/decode-ras").then((m) => m.decodeRas),
	"image/vnd.wap.wbmp": () =>
		import("../decoders/decode-wbmp").then((m) => m.decodeWbmp),
	"image/x-sfw": () =>
		import("../decoders/decode-sfw").then((m) => m.decodeSfw),
	"image/x-photo-cd": () =>
		import("../decoders/decode-pcd").then((m) => m.decodePcd),
	"image/x-pict": () =>
		import("../decoders/decode-pict").then((m) => m.decodePict),
	"image/x-icns": () =>
		import("../decoders/decode-icns").then((m) => m.decodeIcns),
	"application/postscript": () =>
		import("../decoders/decode-eps").then((m) => m.decodeEps),
	"image/x-xcf": () =>
		import("../decoders/decode-xcf").then((m) => m.decodeXcf),
	"application/illustrator": () =>
		import("../decoders/decode-ai").then((m) => m.decodeAi),
	"image/x-xbitmap": () =>
		import("../decoders/decode-xbm").then((m) => m.decodeXbm),
	"image/x-xpixmap": () =>
		import("../decoders/decode-xpm").then((m) => m.decodeXpm),
	"image/x-xwindowdump": () =>
		import("../decoders/decode-xwd").then((m) => m.decodeXwd),
	"application/vnd.ms-xpsdocument": () =>
		import("../decoders/decode-xps").then((m) => m.decodeXps),
	"application/oxps": () =>
		import("../decoders/decode-xps").then((m) => m.decodeXps),
	"application/vnd.oasis.opendocument.graphics": () =>
		import("../decoders/decode-odg").then((m) => m.decodeOdg),
	"application/vnd.corel-draw": () =>
		import("../decoders/decode-cdr").then((m) => m.decodeCdr),
	"application/vnd.visio": () =>
		import("../decoders/decode-vsd").then((m) => m.decodeVsd),
	"application/vnd.ms-visio.drawing.main+xml": () =>
		import("../decoders/decode-vsdx").then((m) => m.decodeVsdx),
	"application/x-mspublisher": () =>
		import("../decoders/decode-pub").then((m) => m.decodePub),
	"image/x-emf": () =>
		import("../decoders/decode-emf").then((m) => m.decodeEmf),
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
	psb: "image/vnd.adobe.photoshop-large",
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
	j2k: "image/jp2",
	jpf: "image/jp2",
	jpx: "image/jp2",
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
	// Legacy formats
	sgi: "image/x-sgi",
	rgb: "image/x-sgi",
	bw: "image/x-sgi",
	ras: "image/x-sun-raster",
	wbmp: "image/vnd.wap.wbmp",
	sfw: "image/x-sfw",
	pcd: "image/x-photo-cd",
	pict: "image/x-pict",
	pct: "image/x-pict",
	icns: "image/x-icns",
	eps: "application/postscript",
	ps: "application/postscript",
	ai: "application/illustrator",
	svgz: "image/svg+xml-compressed",
	// X Window formats
	xbm: "image/x-xbitmap",
	xpm: "image/x-xpixmap",
	picon: "image/x-xpixmap",
	xwd: "image/x-xwindowdump",
	// Document/archive formats with embedded images
	xps: "application/vnd.ms-xpsdocument",
	oxps: "application/oxps",
	odg: "application/vnd.oasis.opendocument.graphics",
	cdr: "application/vnd.corel-draw",
	vsd: "application/vnd.visio",
	vsdx: "application/vnd.ms-visio.drawing.main+xml",
	pub: "application/x-mspublisher",
	emf: "image/x-emf",
};

/**
 * Infer MIME type from file extension for decoder lookup.
 *
 * For any extension in our EXTENSION_TO_MIME map (exotic formats with custom decoders),
 * always prefer our mapping over the browser's MIME detection — browsers often report
 * empty, generic, or non-standard MIME types for exotic formats (e.g., "image/tga"
 * instead of "image/x-tga"), causing decoder lookup mismatches.
 *
 * For mainstream formats not in our map (.jpg, .png, .gif, etc.), trust the browser.
 */
export function inferMime(file: { name: string; type: string }): string {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	if (ext in EXTENSION_TO_MIME) return EXTENSION_TO_MIME[ext];
	return file.type;
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
 * Ensure a file is browser-displayable (for `<img src>` preview).
 *
 * - HEIC/HEIF → decoded via heic2any to PNG blob
 * - Exotic formats with pixel decoders (TGA, PSD, EXR, etc.) → decoded to
 *   RGBA pixels, drawn to canvas, exported as lossless PNG blob
 * - Browser-native formats (JPG, PNG, WebP, etc.) → returned as-is
 */
export async function ensureDecodable(
	input: Blob,
	signal?: AbortSignal,
): Promise<Blob> {
	// HEIC: use heic2any (requires DOM canvas)
	if (HEIC_TYPES.has(input.type)) {
		return decodeHeic(input, "image/png", 1, signal);
	}

	// Exotic formats: decode via pixel decoder → canvas → PNG blob
	const mime = input instanceof File ? inferMime(input) : input.type;

	// SVGZ: decompress to SVG (browser-native)
	if (mime === "image/svg+xml-compressed") {
		return decompressSvgz(input, signal);
	}
	const pixels = await decodeToPixels(input, mime, signal);
	if (pixels) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		const canvas = document.createElement("canvas");
		canvas.width = pixels.width;
		canvas.height = pixels.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Could not get canvas 2D context");
		const imageData = new ImageData(
			new Uint8ClampedArray(
				pixels.data.buffer as ArrayBuffer,
				pixels.data.byteOffset,
				pixels.data.byteLength,
			),
			pixels.width,
			pixels.height,
		);
		ctx.putImageData(imageData, 0, 0);
		return new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (blob) resolve(blob);
				else reject(new Error("Failed to create preview image"));
			}, "image/png");
		});
	}

	// Browser-native format: return as-is
	return input;
}

/**
 * Decompress an SVGZ (gzip-compressed SVG) file to a plain SVG blob.
 * The browser can then decode the SVG natively via createImageBitmap.
 */
async function decompressSvgz(
	input: Blob,
	signal?: AbortSignal,
): Promise<Blob> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();
	const bytes = new Uint8Array(buffer);

	if (bytes.length < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
		throw new Error(
			"This SVGZ file could not be decoded. Invalid gzip header.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let svgText: string;
	try {
		const ds = new DecompressionStream("gzip");
		const readable = new Blob([buffer]).stream().pipeThrough(ds);
		svgText = await new Response(readable).text();
	} catch {
		const { gunzipSync } = await import("fflate");
		svgText = new TextDecoder().decode(gunzipSync(bytes));
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	if (!svgText.includes("<svg")) {
		throw new Error("Decompressed data does not appear to contain SVG markup.");
	}

	return new Blob([svgText], { type: "image/svg+xml" });
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

/**
 * Rasterize an SVG blob to a PNG blob on the main thread.
 *
 * createImageBitmap(svgBlob) is rejected by Chrome and Safari inside Workers,
 * so we load the SVG through an <img> element, draw it to a <canvas>, and
 * export a raster PNG that the worker can handle.
 */
function rasteriseSvgBlob(
	svgBlob: Blob,
	backgroundColor: string,
	signal?: AbortSignal,
	targetWidth?: number,
	targetHeight?: number,
): Promise<Blob> {
	return new Promise<Blob>((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const url = URL.createObjectURL(svgBlob);
		const img = new Image();

		const cleanup = () => {
			URL.revokeObjectURL(url);
		};

		const onAbort = () => {
			cleanup();
			reject(new DOMException("Aborted", "AbortError"));
		};

		signal?.addEventListener("abort", onAbort, { once: true });

		img.onload = () => {
			signal?.removeEventListener("abort", onAbort);
			if (signal?.aborted) {
				cleanup();
				reject(new DOMException("Aborted", "AbortError"));
				return;
			}

			const natW = img.naturalWidth || 300;
			const natH = img.naturalHeight || 150;

			// Compute output dimensions: use target if provided, preserving
			// aspect ratio when only one dimension is set.
			let w = natW;
			let h = natH;
			if (targetWidth && targetHeight) {
				w = targetWidth;
				h = targetHeight;
			} else if (targetWidth) {
				w = targetWidth;
				h = Math.round(natH * (targetWidth / natW));
			} else if (targetHeight) {
				h = targetHeight;
				w = Math.round(natW * (targetHeight / natH));
			}

			const canvas = document.createElement("canvas");
			canvas.width = w;
			canvas.height = h;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				cleanup();
				reject(new Error("Could not get canvas 2D context"));
				return;
			}

			ctx.drawImage(img, 0, 0, w, h);
			cleanup();

			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error("Failed to rasterize SVG"));
					return;
				}
				resolve(blob);
			}, "image/png");
		};

		img.onerror = () => {
			signal?.removeEventListener("abort", onAbort);
			cleanup();
			reject(new Error("The SVG file could not be loaded for rasterization"));
		};

		img.src = url;
	});
}

/**
 * Load an SVG blob and return its intrinsic (naturalWidth × naturalHeight)
 * dimensions. Useful for computing aspect ratio in the UI.
 */
export function getSvgDimensions(
	svgBlob: Blob,
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(svgBlob);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({
				width: img.naturalWidth || 300,
				height: img.naturalHeight || 150,
			});
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Could not load SVG to read dimensions"));
		};
		img.src = url;
	});
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
		new Uint8ClampedArray(
			data.buffer as ArrayBuffer,
			data.byteOffset,
			data.byteLength,
		),
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
		targetWidth,
		targetHeight,
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
	let decoded = await ensureDecodable(input, signal);

	// SVG blobs can't be decoded via createImageBitmap in Workers (Chrome/Safari
	// reject it). Rasterize on the main thread to a PNG blob first.
	if (decoded.type === "image/svg+xml") {
		decoded = await rasteriseSvgBlob(
			decoded,
			backgroundColor,
			signal,
			targetWidth,
			targetHeight,
		);
	}

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
