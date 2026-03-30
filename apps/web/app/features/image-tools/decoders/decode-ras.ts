import type { DecodedImage } from "./types";

/**
 * Decode a Sun Raster (.ras) file to raw RGBA pixels.
 *
 * Custom parser — no external library. Handles:
 * - Type 0 (old), Type 1 (standard/raw), Type 2 (byte-run RLE)
 * - 1, 8, 24, and 32-bit depths
 * - Color-mapped images (maptype=1: separate R, G, B planes)
 * - BGR → RGB reordering for 24-bit, ABGR → RGBA for 32-bit
 * - Scanline padding to 16-bit (even byte) boundary
 */
export async function decodeRas(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	if (buffer.byteLength < 32) {
		throw new Error(
			"This Sun Raster file could not be decoded. The header is too short.",
		);
	}

	// Magic: 0x59A66A95 (big-endian)
	const magic = view.getUint32(0, false);
	if (magic !== 0x59a66a95) {
		throw new Error(
			"This Sun Raster file could not be decoded. Invalid magic number.",
		);
	}

	const width = view.getUint32(4, false);
	const height = view.getUint32(8, false);
	const depth = view.getUint32(12, false);
	// const dataLength = view.getUint32(16, false);
	const type = view.getUint32(20, false);
	const maptype = view.getUint32(24, false);
	const maplength = view.getUint32(28, false);

	if (width === 0 || height === 0) {
		throw new Error(
			"This Sun Raster file could not be decoded. Image dimensions are zero.",
		);
	}

	if (width > 16384 || height > 16384) {
		throw new Error(
			"This Sun Raster file could not be decoded. Image dimensions exceed 16384.",
		);
	}

	if (type !== 0 && type !== 1 && type !== 2) {
		throw new Error(`This Sun Raster file uses unsupported type (${type}).`);
	}

	// Read colormap if present
	let colormap: Uint8Array | null = null;
	let dataOffset = 32;

	if (maptype === 1 && maplength > 0) {
		if (dataOffset + maplength > bytes.length) {
			throw new Error(
				"This Sun Raster file could not be decoded. Colormap data is truncated.",
			);
		}
		colormap = bytes.slice(dataOffset, dataOffset + maplength);
		dataOffset += maplength;
	} else {
		dataOffset += maplength; // skip any map data even if type is not 1
	}

	// Decode pixel data (raw or RLE)
	let pixelData: Uint8Array;

	if (type === 2) {
		// Byte-run RLE
		pixelData = decodeRle(bytes, dataOffset);
	} else {
		// Raw (type 0 or 1)
		pixelData = bytes.slice(dataOffset);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Calculate bytes per scanline (padded to 16-bit boundary)
	const bitsPerRow = width * depth;
	const bytesPerRow = Math.ceil(bitsPerRow / 8);
	// Pad to even byte count (16-bit boundary)
	const paddedBytesPerRow = bytesPerRow + (bytesPerRow % 2);

	const rgba = new Uint8Array(width * height * 4);
	const colormapEntries = maplength > 0 ? Math.floor(maplength / 3) : 0;

	for (let y = 0; y < height; y++) {
		const rowStart = y * paddedBytesPerRow;

		for (let x = 0; x < width; x++) {
			const dst = (y * width + x) * 4;

			if (depth === 32) {
				// ABGR → RGBA
				const srcOff = rowStart + x * 4;
				rgba[dst] = pixelData[srcOff + 3]; // R (was at +3 in ABGR)
				rgba[dst + 1] = pixelData[srcOff + 2]; // G
				rgba[dst + 2] = pixelData[srcOff + 1]; // B
				rgba[dst + 3] = pixelData[srcOff]; // A
			} else if (depth === 24) {
				// BGR → RGBA
				const srcOff = rowStart + x * 3;
				rgba[dst] = pixelData[srcOff + 2]; // R
				rgba[dst + 1] = pixelData[srcOff + 1]; // G
				rgba[dst + 2] = pixelData[srcOff]; // B
				rgba[dst + 3] = 255;
			} else if (depth === 8) {
				const index = pixelData[rowStart + x];
				if (colormap && colormapEntries > 0) {
					// Colormap planes: R plane, then G plane, then B plane
					rgba[dst] = colormap[index]; // R
					rgba[dst + 1] = colormap[colormapEntries + index]; // G
					rgba[dst + 2] = colormap[2 * colormapEntries + index]; // B
					rgba[dst + 3] = 255;
				} else {
					// Grayscale
					rgba[dst] = index;
					rgba[dst + 1] = index;
					rgba[dst + 2] = index;
					rgba[dst + 3] = 255;
				}
			} else if (depth === 1) {
				// 1-bit monochrome (1 = foreground/black, 0 = background/white)
				const byteIndex = Math.floor(x / 8);
				const bitIndex = 7 - (x % 8);
				const bit = (pixelData[rowStart + byteIndex] >> bitIndex) & 1;
				const color = bit ? 0 : 255;
				rgba[dst] = color;
				rgba[dst + 1] = color;
				rgba[dst + 2] = color;
				rgba[dst + 3] = 255;
			} else {
				throw new Error(
					`This Sun Raster file uses unsupported depth (${depth}).`,
				);
			}
		}
	}

	return { data: rgba, width, height };
}

/**
 * Decode byte-run RLE used in Sun Raster type 2.
 *
 * Escape byte is 0x80:
 * - 0x80 0x00 → literal 0x80
 * - 0x80 N V  → repeat V (N+1) times
 * - any other byte → literal
 */
function decodeRle(src: Uint8Array, offset: number): Uint8Array {
	// Estimate output size generously
	const out: number[] = [];
	let pos = offset;

	while (pos < src.length) {
		const byte = src[pos++];
		if (byte === 0x80) {
			if (pos >= src.length) break;
			const count = src[pos++];
			if (count === 0) {
				// Literal 0x80
				out.push(0x80);
			} else {
				// Repeat next byte (count + 1) times
				if (pos >= src.length) break;
				const value = src[pos++];
				for (let i = 0; i <= count; i++) {
					out.push(value);
				}
			}
		} else {
			out.push(byte);
		}
	}

	return new Uint8Array(out);
}
