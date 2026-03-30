import type { DecodedImage } from "./types";

let wasmInitialized = false;

/**
 * Decode a JPEG XL file to raw RGBA pixels using jxl-oxide-wasm.
 *
 * Strategy: try browser-native createImageBitmap first (Firefox 125+ supports JXL).
 * If that fails, fall back to the WASM decoder.
 */
export async function decodeJxl(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Try browser-native decode first (Firefox 125+ supports JXL natively)
	try {
		const bitmap = await createImageBitmap(input);
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.drawImage(bitmap, 0, 0);
			bitmap.close();
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			return {
				data: new Uint8Array(
					imageData.data.buffer,
					imageData.data.byteOffset,
					imageData.data.byteLength,
				),
				width: canvas.width,
				height: canvas.height,
			};
		}
		bitmap.close();
	} catch {
		// Native decode not supported — fall through to WASM
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// WASM fallback: lazy-load jxl-oxide-wasm
	const jxlModule = await import("jxl-oxide-wasm");

	if (!wasmInitialized) {
		// Initialize WASM module (loads the .wasm file)
		await jxlModule.default();
		wasmInitialized = true;
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();
	const bytes = new Uint8Array(buffer);

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Decode JXL to PNG using jxl-oxide
	const image = new jxlModule.JxlImage();
	try {
		image.feedBytes(bytes);
		if (!image.tryInit()) {
			throw new Error(
				"This JPEG XL file could not be decoded. It may be corrupted or use an unsupported variant.",
			);
		}

		// Render the first frame (keyframe 0)
		const result = image.render(0);
		const pngBytes = result.encodeToPng();
		result.free();

		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		// Decode the PNG to get raw RGBA pixels
		const pngBlob = new Blob([pngBytes as BlobPart], { type: "image/png" });
		const bitmap = await createImageBitmap(pngBlob);
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			bitmap.close();
			throw new Error("Could not get canvas 2D context");
		}
		ctx.drawImage(bitmap, 0, 0);
		bitmap.close();
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		return {
			data: new Uint8Array(
				imageData.data.buffer,
				imageData.data.byteOffset,
				imageData.data.byteLength,
			),
			width: canvas.width,
			height: canvas.height,
		};
	} finally {
		image.free();
	}
}
