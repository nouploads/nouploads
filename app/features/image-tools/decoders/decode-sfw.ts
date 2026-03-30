import type { DecodedImage } from "./types";

/**
 * Decode a Seattle Film Works (SFW) file to raw RGBA pixels.
 *
 * SFW files are JPEG images wrapped in a proprietary container.
 * The decoder scans for the JPEG magic bytes (0xFF 0xD8 0xFF),
 * extracts the JPEG data, and decodes it via createImageBitmap.
 *
 * Requires a browser environment with createImageBitmap and
 * OffscreenCanvas (or canvas) support.
 */
export async function decodeSfw(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);

	if (bytes.length < 4) {
		throw new Error(
			"This SFW file could not be decoded. The file is too short.",
		);
	}

	// Scan for JPEG magic: 0xFF 0xD8 0xFF
	const jpegOffset = findJpegStart(bytes);
	if (jpegOffset === -1) {
		throw new Error(
			"This SFW file could not be decoded. No embedded JPEG data found.",
		);
	}

	// Extract JPEG from the first occurrence to end of file
	const jpegData = bytes.slice(jpegOffset);
	const jpegBlob = new Blob([jpegData], { type: "image/jpeg" });

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Decode via browser's JPEG decoder
	const bitmap = await createImageBitmap(jpegBlob);

	if (signal?.aborted) {
		bitmap.close();
		throw new DOMException("Aborted", "AbortError");
	}

	const { width, height } = bitmap;

	// Draw to canvas and extract RGBA pixel data
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("Could not get OffscreenCanvas 2D context.");
	}

	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();

	const imageData = ctx.getImageData(0, 0, width, height);
	return {
		data: new Uint8Array(imageData.data.buffer),
		width,
		height,
	};
}

/**
 * Find the byte offset of the first JPEG SOI marker (0xFF 0xD8 0xFF) in the buffer.
 * Returns -1 if not found.
 */
function findJpegStart(bytes: Uint8Array): number {
	for (let i = 0; i <= bytes.length - 3; i++) {
		if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
			return i;
		}
	}
	return -1;
}
