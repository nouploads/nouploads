import type { DecodedImage } from "./types";

/**
 * Decode a CorelDRAW CDR file by extracting an embedded preview image.
 *
 * CDR files come in two flavors:
 * 1. Classic RIFF container (CDR versions up to X4) — walk RIFF chunks
 *    looking for a DISP/disp chunk or embedded BMP/TIFF data.
 * 2. ZIP archive (CDR X5+) — open with JSZip and look for thumbnail images.
 *
 * Full vector rendering is not feasible in-browser. Only embedded previews
 * are extracted.
 */
export async function decodeCdr(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();
	const bytes = new Uint8Array(buffer);

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Check if it's a RIFF container (classic CDR)
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46
	) {
		const result = extractFromRiff(bytes);
		if (result) {
			return decodeImageBytes(result, signal);
		}
	}

	// Check if it's a ZIP archive (CDR X5+)
	if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
		return extractFromZip(buffer, signal);
	}

	// Last resort: scan raw bytes for embedded images
	const rawImage = scanForEmbeddedImage(bytes);
	if (rawImage) {
		return decodeImageBytes(rawImage, signal);
	}

	throw new Error("This CDR file has no embedded preview.");
}

/**
 * Walk RIFF chunks looking for DISP chunk or embedded BMP/TIFF data.
 */
function extractFromRiff(bytes: Uint8Array): Uint8Array | null {
	if (bytes.length < 12) return null;

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

	// RIFF header: "RIFF" + 4-byte LE size + 4-byte form type
	let offset = 12; // Skip past RIFF header

	while (offset + 8 <= bytes.length) {
		const chunkType = String.fromCharCode(
			bytes[offset],
			bytes[offset + 1],
			bytes[offset + 2],
			bytes[offset + 3],
		);
		const chunkSize = view.getUint32(offset + 4, true);
		const dataStart = offset + 8;
		const dataEnd = Math.min(dataStart + chunkSize, bytes.length);

		// DISP or disp chunk contains a display preview
		if ((chunkType === "DISP" || chunkType === "disp") && chunkSize > 8) {
			// DISP chunk: first 4 bytes are clipboard format type, then the image data
			const imageData = bytes.slice(dataStart + 4, dataEnd);
			// Check if it starts with BMP magic
			if (
				imageData.length > 2 &&
				imageData[0] === 0x42 &&
				imageData[1] === 0x4d
			) {
				return imageData;
			}
			// Check for TIFF magic (II*\0)
			if (
				imageData.length > 4 &&
				imageData[0] === 0x49 &&
				imageData[1] === 0x49 &&
				imageData[2] === 0x2a &&
				imageData[3] === 0x00
			) {
				return imageData;
			}
			// Some DISP chunks contain raw DIB data (no BM header) — try it directly
			if (imageData.length > 40) {
				return imageData;
			}
		}

		// LIST chunk may contain nested chunks
		if (chunkType === "LIST" && chunkSize > 4) {
			const listType = String.fromCharCode(
				bytes[dataStart],
				bytes[dataStart + 1],
				bytes[dataStart + 2],
				bytes[dataStart + 3],
			);
			// Skip into the LIST to check sub-chunks — but only for strs or other known list types
			if (listType === "strs" || listType === "cmpr") {
				// Scan the sub-chunks within the LIST
				const subResult = scanChunkForImages(bytes, dataStart + 4, dataEnd);
				if (subResult) return subResult;
			}
		}

		// Advance to next chunk (padded to even boundary)
		offset = dataStart + chunkSize + (chunkSize % 2);
	}

	// If no DISP chunk found, scan entire RIFF data for embedded images
	return scanForEmbeddedImage(bytes);
}

/**
 * Scan a range of bytes for embedded BMP or TIFF data.
 */
function scanChunkForImages(
	bytes: Uint8Array,
	start: number,
	end: number,
): Uint8Array | null {
	for (let i = start; i < end - 4; i++) {
		// BMP magic: "BM"
		if (bytes[i] === 0x42 && bytes[i + 1] === 0x4d) {
			const view = new DataView(
				bytes.buffer,
				bytes.byteOffset,
				bytes.byteLength,
			);
			const bmpSize = view.getUint32(i + 2, true);
			if (bmpSize > 14 && bmpSize <= end - i) {
				return bytes.slice(i, i + bmpSize);
			}
		}
		// TIFF magic: "II*\0"
		if (
			bytes[i] === 0x49 &&
			bytes[i + 1] === 0x49 &&
			bytes[i + 2] === 0x2a &&
			bytes[i + 3] === 0x00
		) {
			return bytes.slice(i, end);
		}
	}
	return null;
}

/**
 * Scan raw bytes for JPEG, PNG, BMP, or TIFF embedded images.
 */
function scanForEmbeddedImage(bytes: Uint8Array): Uint8Array | null {
	for (let i = 0; i < bytes.length - 4; i++) {
		// JPEG magic: FF D8 FF
		if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
			// Find JPEG end marker (FF D9)
			for (let j = i + 3; j < bytes.length - 1; j++) {
				if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
					return bytes.slice(i, j + 2);
				}
			}
		}
		// PNG magic: 89 50 4E 47
		if (
			bytes[i] === 0x89 &&
			bytes[i + 1] === 0x50 &&
			bytes[i + 2] === 0x4e &&
			bytes[i + 3] === 0x47
		) {
			// Find PNG end marker (IEND chunk)
			for (let j = i + 8; j < bytes.length - 8; j++) {
				if (
					bytes[j] === 0x49 &&
					bytes[j + 1] === 0x45 &&
					bytes[j + 2] === 0x4e &&
					bytes[j + 3] === 0x44
				) {
					return bytes.slice(i, j + 8); // Include IEND CRC
				}
			}
		}
		// BMP magic: "BM"
		if (bytes[i] === 0x42 && bytes[i + 1] === 0x4d && i + 6 <= bytes.length) {
			const view = new DataView(
				bytes.buffer,
				bytes.byteOffset,
				bytes.byteLength,
			);
			const bmpSize = view.getUint32(i + 2, true);
			if (bmpSize > 14 && bmpSize <= bytes.length - i) {
				return bytes.slice(i, i + bmpSize);
			}
		}
	}
	return null;
}

/**
 * Extract a preview image from a ZIP-based CDR (X5+).
 */
async function extractFromZip(
	buffer: ArrayBuffer,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	const { default: JSZip } = await import("jszip");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>;
	try {
		zip = await JSZip.loadAsync(buffer);
	} catch {
		throw new Error(
			"This CDR file could not be opened. It may be corrupted or not a valid archive.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Known thumbnail locations in ZIP-based CDR files
	const thumbnailPaths = [
		"metadata/thumbnail.bmp",
		"metadata/thumbnail.png",
		"metadata/thumbnail.jpg",
		"image/thumbnail.bmp",
		"image/thumbnail.png",
	];

	for (const path of thumbnailPaths) {
		const entry = zip.file(path);
		if (entry) {
			const data = await entry.async("uint8array");
			if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
			return decodeImageBytes(data, signal);
		}
	}

	// Search for any image file in the archive
	const imageExtensions = new Set([".bmp", ".png", ".jpg", ".jpeg", ".tiff"]);
	const candidates: { path: string; data: Uint8Array }[] = [];

	for (const [path, entry] of Object.entries(zip.files)) {
		if (entry.dir) continue;
		const lower = path.toLowerCase();
		const dotIdx = lower.lastIndexOf(".");
		if (dotIdx === -1) continue;
		const ext = lower.slice(dotIdx);
		if (!imageExtensions.has(ext)) continue;

		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		const data = await entry.async("uint8array");
		candidates.push({ path, data });
	}

	if (candidates.length === 0) {
		throw new Error("This CDR file has no embedded preview.");
	}

	// Pick the largest image
	candidates.sort((a, b) => b.data.length - a.data.length);
	return decodeImageBytes(candidates[0].data, signal);
}

/**
 * Decode image bytes (BMP, PNG, JPG, TIFF) to RGBA pixels via createImageBitmap.
 * For TIFF data, delegates to decodeTiff.
 */
async function decodeImageBytes(
	data: Uint8Array,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	// Check for TIFF magic
	if (
		data.length > 4 &&
		data[0] === 0x49 &&
		data[1] === 0x49 &&
		data[2] === 0x2a &&
		data[3] === 0x00
	) {
		const { decodeTiff } = await import("./decode-tiff");
		return decodeTiff(new Blob([data as BlobPart]), signal);
	}

	const blob = new Blob([data as BlobPart]);

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(blob);
	} catch {
		throw new Error(
			"Could not decode the embedded preview image from the CDR file.",
		);
	}

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
