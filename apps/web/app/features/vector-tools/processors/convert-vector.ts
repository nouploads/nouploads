import type { VectorDecoderFn, VectorDecoderResult } from "../decoders/types";

const VECTOR_DECODERS: Record<string, () => Promise<VectorDecoderFn>> = {
	// Entries added as decoders are implemented
};

/** Extension to MIME mapping for vector formats the browser doesn't recognise. */
const VECTOR_EXTENSION_TO_MIME: Record<string, string> = {
	svgz: "image/svg+xml+gzip",
	ai: "application/postscript",
	cdr: "application/vnd.corel-draw",
	vsd: "application/vnd.visio",
	vsdx: "application/vnd.ms-visio.drawing.main+xml",
	emf: "image/x-emf",
	wmf: "image/x-wmf",
	pub: "application/x-mspublisher",
};

/**
 * Infer the MIME type for a vector file.
 * Falls back to the browser-reported `file.type` when no extension match exists.
 */
export function inferVectorMime(file: { name: string; type: string }): string {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	if (ext in VECTOR_EXTENSION_TO_MIME) return VECTOR_EXTENSION_TO_MIME[ext];
	return file.type;
}

/**
 * Decode a vector file into SVG markup via the registered decoder for its MIME.
 * Returns `null` when no decoder is registered for the given MIME type.
 */
export async function decodeVector(
	input: Blob,
	mime: string,
	signal?: AbortSignal,
): Promise<VectorDecoderResult | null> {
	const loaderThunk = VECTOR_DECODERS[mime];
	if (!loaderThunk) return null;
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
	const decode = await loaderThunk();
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
	return decode(input, signal);
}

/** Output raster MIME types supported by the vector converter. */
export type VectorOutputFormat =
	| "svg"
	| "image/png"
	| "image/jpeg"
	| "image/webp"
	| "image/avif";

/** File extension for a given output format. */
export function extensionForVectorFormat(format: VectorOutputFormat): string {
	switch (format) {
		case "svg":
			return "svg";
		case "image/png":
			return "png";
		case "image/jpeg":
			return "jpg";
		case "image/webp":
			return "webp";
		case "image/avif":
			return "avif";
	}
}

export interface RasteriseOptions {
	/** Target raster MIME. Ignored when format is "svg". */
	mime: "image/png" | "image/jpeg" | "image/webp" | "image/avif";
	/** Resolution multiplier (1 = native SVG size). */
	scale: number;
	/** 0-1 quality for lossy formats. Ignored for PNG. */
	quality?: number;
	signal?: AbortSignal;
}

/**
 * Render SVG markup to a raster Blob via an offscreen `<img>` + `<canvas>`.
 * Must be called from the main thread (requires DOM access).
 */
export function rasteriseSvg(
	svgMarkup: string,
	opts: RasteriseOptions,
): Promise<Blob> {
	return new Promise<Blob>((resolve, reject) => {
		if (opts.signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml" });
		const url = URL.createObjectURL(svgBlob);
		const img = new Image();

		const cleanup = () => {
			URL.revokeObjectURL(url);
		};

		const onAbort = () => {
			cleanup();
			reject(new DOMException("Aborted", "AbortError"));
		};

		opts.signal?.addEventListener("abort", onAbort, { once: true });

		img.onload = () => {
			opts.signal?.removeEventListener("abort", onAbort);
			if (opts.signal?.aborted) {
				cleanup();
				reject(new DOMException("Aborted", "AbortError"));
				return;
			}

			const w = Math.round(img.naturalWidth * opts.scale);
			const h = Math.round(img.naturalHeight * opts.scale);

			const canvas = document.createElement("canvas");
			canvas.width = w;
			canvas.height = h;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				cleanup();
				reject(new Error("Failed to get canvas context"));
				return;
			}

			// For JPEG, fill white background (no transparency support)
			if (opts.mime === "image/jpeg") {
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, w, h);
			}

			ctx.drawImage(img, 0, 0, w, h);
			cleanup();

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						reject(new Error("Canvas toBlob returned null"));
						return;
					}
					resolve(blob);
				},
				opts.mime,
				opts.quality,
			);
		};

		img.onerror = () => {
			opts.signal?.removeEventListener("abort", onAbort);
			cleanup();
			reject(new Error("Failed to load SVG as image"));
		};

		img.src = url;
	});
}
