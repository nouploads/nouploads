import type { DecodedImage } from "./types";

/**
 * Decode a camera RAW file by extracting its embedded JPEG preview.
 *
 * Most camera RAW formats (CR2, CR3, NEF, ARW, DNG, RAF, ORF, etc.)
 * embed one or more JPEG previews. This decoder scans the raw bytes
 * for JPEG start (FF D8 FF) and end (FF D9) markers, picks the
 * largest embedded JPEG (which is typically the full-resolution
 * preview), then decodes it via createImageBitmap + canvas.
 *
 * This is NOT full RAW demosaicing --- it extracts the camera's
 * pre-baked JPEG preview. For full RAW processing with white balance
 * and exposure control, use Lightroom or darktable.
 */
export async function decodeRaw(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);
	const jpeg = extractLargestJpeg(bytes);

	if (!jpeg) {
		throw new Error(
			"This RAW file does not contain an embedded JPEG preview. Full RAW processing is not supported.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const jpegBlob = new Blob([jpeg], { type: "image/jpeg" });
	const bitmap = await createImageBitmap(jpegBlob);

	if (signal?.aborted) {
		bitmap.close();
		throw new DOMException("Aborted", "AbortError");
	}

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
}

/**
 * Scan raw bytes for all embedded JPEG images and return the largest one.
 *
 * Why scan for ALL JPEGs, not just the first:
 * - Many RAW files contain a small thumbnail JPEG first, then a
 *   full-resolution JPEG later.
 * - Picking the largest ensures we get the full-res preview.
 */
function extractLargestJpeg(bytes: Uint8Array): Uint8Array | null {
	let bestStart = -1;
	let bestLength = 0;

	const len = bytes.length;
	let i = 0;

	while (i < len - 2) {
		// Look for JPEG SOI marker: FF D8 FF
		if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
			const start = i;
			// Scan forward for JPEG EOI marker: FF D9
			let j = start + 3;
			let found = false;
			while (j < len - 1) {
				if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
					const jpegLength = j + 2 - start;
					if (jpegLength > bestLength) {
						bestStart = start;
						bestLength = jpegLength;
					}
					// Continue past this JPEG to look for more
					i = j + 2;
					found = true;
					break;
				}
				j++;
			}
			if (!found) {
				// No EOI found for this SOI --- skip past it
				i = start + 3;
			}
		} else {
			i++;
		}
	}

	if (bestStart < 0) return null;
	return bytes.slice(bestStart, bestStart + bestLength);
}
