import type { DecodedImage } from "./types";

/**
 * Decode an XWD (X Window Dump) file to raw RGBA pixels.
 *
 * Custom parser — no external library. XWD is a binary format with:
 * - A variable-length header (minimum 100 bytes for version 7)
 * - An optional colormap
 * - Raw pixel data
 *
 * Supports 32bpp, 24bpp, and 8bpp (colormap indexed) images.
 */
export async function decodeXwd(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const view = new DataView(buffer);

	if (buffer.byteLength < 100) {
		throw new Error(
			"This XWD file could not be decoded. The header is too short.",
		);
	}

	// All header fields are uint32 big-endian
	const headerSize = view.getUint32(0, false);
	const fileVersion = view.getUint32(4, false);

	if (fileVersion !== 7) {
		throw new Error(
			`This XWD file uses an unsupported version (${fileVersion}). Only version 7 is supported.`,
		);
	}

	if (headerSize < 100 || headerSize > buffer.byteLength) {
		throw new Error("This XWD file could not be decoded. Invalid header size.");
	}

	const width = view.getUint32(16, false);
	const height = view.getUint32(20, false);
	const byteOrder = view.getUint32(28, false); // 0 = MSBFirst, 1 = LSBFirst
	const bitsPerPixel = view.getUint32(44, false);
	const bytesPerLine = view.getUint32(48, false);
	const ncolors = view.getUint32(88, false);

	if (width === 0 || height === 0) {
		throw new Error(
			"This XWD file could not be decoded. Image dimensions are zero.",
		);
	}

	if (width > 16384 || height > 16384) {
		throw new Error(
			"This XWD file could not be decoded. Image dimensions exceed 16384.",
		);
	}

	// Colormap starts right after the header
	let offset = headerSize;

	// Read colormap if present (each XWDColor entry is 12 bytes)
	const colormap: Array<[number, number, number]> = [];
	if (ncolors > 0) {
		const colormapSize = ncolors * 12;
		if (offset + colormapSize > buffer.byteLength) {
			throw new Error(
				"This XWD file could not be decoded. Colormap data is truncated.",
			);
		}
		for (let i = 0; i < ncolors; i++) {
			const entryOffset = offset + i * 12;
			// XWDColor: uint32 pixel, uint16 r, uint16 g, uint16 b, uint8 flags, uint8 pad
			const r = view.getUint16(entryOffset + 4, false) >> 8;
			const g = view.getUint16(entryOffset + 6, false) >> 8;
			const b = view.getUint16(entryOffset + 8, false) >> 8;
			colormap.push([r, g, b]);
		}
		offset += colormapSize;
	}

	// Pixel data
	const pixelDataSize = bytesPerLine * height;
	if (offset + pixelDataSize > buffer.byteLength) {
		throw new Error(
			"This XWD file could not be decoded. Pixel data is truncated.",
		);
	}

	const bytes = new Uint8Array(buffer);
	const rgba = new Uint8Array(width * height * 4);

	if (bitsPerPixel === 32) {
		for (let y = 0; y < height; y++) {
			const lineStart = offset + y * bytesPerLine;
			for (let x = 0; x < width; x++) {
				const px = lineStart + x * 4;
				const dst = (y * width + x) * 4;
				if (byteOrder === 0) {
					// MSBFirst: XRGB (or ARGB) — byte 0 is padding/alpha, 1=R, 2=G, 3=B
					rgba[dst] = bytes[px + 1];
					rgba[dst + 1] = bytes[px + 2];
					rgba[dst + 2] = bytes[px + 3];
				} else {
					// LSBFirst: BGRX — byte 0=B, 1=G, 2=R, 3=padding
					rgba[dst] = bytes[px + 2];
					rgba[dst + 1] = bytes[px + 1];
					rgba[dst + 2] = bytes[px];
				}
				rgba[dst + 3] = 255;
			}
		}
	} else if (bitsPerPixel === 24) {
		for (let y = 0; y < height; y++) {
			const lineStart = offset + y * bytesPerLine;
			for (let x = 0; x < width; x++) {
				const px = lineStart + x * 3;
				const dst = (y * width + x) * 4;
				if (byteOrder === 0) {
					// MSBFirst: RGB
					rgba[dst] = bytes[px];
					rgba[dst + 1] = bytes[px + 1];
					rgba[dst + 2] = bytes[px + 2];
				} else {
					// LSBFirst: BGR
					rgba[dst] = bytes[px + 2];
					rgba[dst + 1] = bytes[px + 1];
					rgba[dst + 2] = bytes[px];
				}
				rgba[dst + 3] = 255;
			}
		}
	} else if (bitsPerPixel === 8) {
		if (colormap.length === 0) {
			throw new Error(
				"This XWD file could not be decoded. 8bpp image requires a colormap.",
			);
		}
		for (let y = 0; y < height; y++) {
			const lineStart = offset + y * bytesPerLine;
			for (let x = 0; x < width; x++) {
				const index = bytes[lineStart + x];
				const dst = (y * width + x) * 4;
				if (index < colormap.length) {
					rgba[dst] = colormap[index][0];
					rgba[dst + 1] = colormap[index][1];
					rgba[dst + 2] = colormap[index][2];
				}
				rgba[dst + 3] = 255;
			}
		}
	} else {
		throw new Error(
			`This XWD file uses an unsupported pixel depth (${bitsPerPixel} bpp).`,
		);
	}

	return { data: rgba, width, height };
}
