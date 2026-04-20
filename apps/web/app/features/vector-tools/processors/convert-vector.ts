// Core tool is a browser-only stub — SVG rasterization needs an <img>
// element and a canvas, both DOM-only. Type-only import keeps the
// architecture drift test satisfied.
import type {} from "@nouploads/core/tools/browser-only-stubs";

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
