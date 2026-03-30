import type { ImageData } from "../backend.js";

/**
 * Decode a TGA (Targa) file to raw RGBA pixels.
 *
 * Custom parser — no external library. Handles:
 * - Uncompressed true-color (type 2), grayscale (type 3), color-mapped (type 1)
 * - RLE-compressed true-color (type 10), grayscale (type 11), color-mapped (type 9)
 * - 8, 16, 24, 32 bpp
 * - BGR(A) → RGB(A) byte swapping
 * - Bottom-to-top origin flipping (bit 5 of image descriptor)
 */
export async function decodeTga(input: Uint8Array): Promise<ImageData> {
	const buffer = input.buffer.slice(
		input.byteOffset,
		input.byteOffset + input.byteLength,
	);
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	if (buffer.byteLength < 18) {
		throw new Error(
			"This TGA file could not be decoded. The header is too short.",
		);
	}

	// Parse 18-byte header
	const idLength = view.getUint8(0);
	const colormapType = view.getUint8(1);
	const imageType = view.getUint8(2);
	// Colormap specification (5 bytes)
	const colormapOrigin = view.getUint16(3, true);
	const colormapLength = view.getUint16(5, true);
	const colormapBpp = view.getUint8(7);
	// Image specification
	const width = view.getUint16(12, true);
	const height = view.getUint16(14, true);
	const bpp = view.getUint8(16);
	const imageDescriptor = view.getUint8(17);

	if (width === 0 || height === 0) {
		throw new Error(
			"This TGA file could not be decoded. Image dimensions are zero.",
		);
	}

	const supportedTypes = new Set([1, 2, 3, 9, 10, 11]);
	if (!supportedTypes.has(imageType)) {
		throw new Error(
			`This TGA file uses an unsupported image type (${imageType}).`,
		);
	}

	let offset = 18 + idLength;

	// Parse colormap if present
	let colormap: Uint8Array[] | null = null;
	if (colormapType === 1) {
		const entryBytes = Math.ceil(colormapBpp / 8);
		colormap = [];
		for (let i = 0; i < colormapLength; i++) {
			const entry = bytes.slice(offset, offset + entryBytes);
			colormap.push(entry);
			offset += entryBytes;
		}
	}

	const isRle = imageType >= 9;
	const pixelCount = width * height;
	const pixelBytes = Math.ceil(bpp / 8);

	// Read raw or RLE pixel data
	const rawPixels = isRle
		? decodeRle(bytes, offset, pixelCount, pixelBytes)
		: bytes.slice(offset, offset + pixelCount * pixelBytes);

	if (rawPixels.length < pixelCount * pixelBytes) {
		throw new Error(
			"This TGA file could not be decoded. Pixel data is truncated.",
		);
	}

	// Convert to RGBA
	const rgba = new Uint8Array(pixelCount * 4);
	const isColorMapped = imageType === 1 || imageType === 9;
	const isGrayscale = imageType === 3 || imageType === 11;

	for (let i = 0; i < pixelCount; i++) {
		const srcOffset = i * pixelBytes;
		const dstOffset = i * 4;

		if (isColorMapped && colormap) {
			const index = rawPixels[srcOffset] - colormapOrigin;
			if (index < 0 || index >= colormap.length) {
				rgba[dstOffset] = 0;
				rgba[dstOffset + 1] = 0;
				rgba[dstOffset + 2] = 0;
				rgba[dstOffset + 3] = 255;
				continue;
			}
			const entry = colormap[index];
			const cmapEntryBytes = Math.ceil(colormapBpp / 8);
			readPixel(entry, 0, cmapEntryBytes, colormapBpp, false, rgba, dstOffset);
		} else if (isGrayscale) {
			const gray = rawPixels[srcOffset];
			rgba[dstOffset] = gray;
			rgba[dstOffset + 1] = gray;
			rgba[dstOffset + 2] = gray;
			rgba[dstOffset + 3] = bpp === 16 ? rawPixels[srcOffset + 1] : 255;
		} else {
			readPixel(rawPixels, srcOffset, pixelBytes, bpp, false, rgba, dstOffset);
		}
	}

	// Flip vertically if origin is bottom-left (bit 5 of image_descriptor is 0)
	const topToBottom = (imageDescriptor & 0x20) !== 0;
	if (!topToBottom) {
		flipRows(rgba, width, height);
	}

	return { data: rgba, width, height };
}

/**
 * Read a single pixel from TGA data (BGR/BGRA order) and write RGBA.
 */
function readPixel(
	src: Uint8Array,
	srcOff: number,
	_pixelBytes: number,
	bpp: number,
	_isGrayscale: boolean,
	dst: Uint8Array,
	dstOff: number,
): void {
	if (bpp === 32) {
		// BGRA → RGBA
		dst[dstOff] = src[srcOff + 2];
		dst[dstOff + 1] = src[srcOff + 1];
		dst[dstOff + 2] = src[srcOff];
		dst[dstOff + 3] = src[srcOff + 3];
	} else if (bpp === 24) {
		// BGR → RGBA
		dst[dstOff] = src[srcOff + 2];
		dst[dstOff + 1] = src[srcOff + 1];
		dst[dstOff + 2] = src[srcOff];
		dst[dstOff + 3] = 255;
	} else if (bpp === 16) {
		// 5-5-5-1 BGRA (little-endian)
		const lo = src[srcOff];
		const hi = src[srcOff + 1];
		const val = lo | (hi << 8);
		dst[dstOff] = (((val >> 10) & 0x1f) * 255) / 31;
		dst[dstOff + 1] = (((val >> 5) & 0x1f) * 255) / 31;
		dst[dstOff + 2] = ((val & 0x1f) * 255) / 31;
		dst[dstOff + 3] = val & 0x8000 ? 255 : 0;
	} else if (bpp === 8) {
		// 8-bit grayscale or palette index handled separately
		dst[dstOff] = src[srcOff];
		dst[dstOff + 1] = src[srcOff];
		dst[dstOff + 2] = src[srcOff];
		dst[dstOff + 3] = 255;
	}
}

/**
 * Decode RLE-compressed TGA pixel data.
 */
function decodeRle(
	src: Uint8Array,
	offset: number,
	pixelCount: number,
	pixelBytes: number,
): Uint8Array {
	const out = new Uint8Array(pixelCount * pixelBytes);
	let outPos = 0;
	let pos = offset;

	while (outPos < pixelCount * pixelBytes && pos < src.length) {
		const header = src[pos++];
		const count = (header & 0x7f) + 1;

		if (header & 0x80) {
			// Run-length packet: repeat next pixel `count` times
			const pixel = src.slice(pos, pos + pixelBytes);
			pos += pixelBytes;
			for (let i = 0; i < count; i++) {
				out.set(pixel, outPos);
				outPos += pixelBytes;
			}
		} else {
			// Raw packet: copy `count` literal pixels
			const length = count * pixelBytes;
			out.set(src.slice(pos, pos + length), outPos);
			pos += length;
			outPos += length;
		}
	}

	return out;
}

/**
 * Flip RGBA pixel rows vertically (bottom-to-top → top-to-bottom).
 */
function flipRows(data: Uint8Array, width: number, height: number): void {
	const rowBytes = width * 4;
	const temp = new Uint8Array(rowBytes);

	for (let y = 0; y < Math.floor(height / 2); y++) {
		const topOffset = y * rowBytes;
		const bottomOffset = (height - 1 - y) * rowBytes;
		temp.set(data.subarray(topOffset, topOffset + rowBytes));
		data.set(data.subarray(bottomOffset, bottomOffset + rowBytes), topOffset);
		data.set(temp, bottomOffset);
	}
}
