import type { ImageData } from "../backend.js";

/**
 * Decode a PCX (ZSoft Paintbrush) file to raw RGBA pixels.
 *
 * Custom parser — no external library. Handles:
 * - 1 plane, 8 bpp: 256-color indexed (VGA palette at EOF)
 * - 3 planes, 8 bpp: 24-bit RGB (separate planes per scanline)
 * - 1 plane, 1 bpp: monochrome (black and white)
 * - RLE decompression (byte >= 0xC0 → run-length)
 */
export async function decodePcx(input: Uint8Array): Promise<ImageData> {
	const buffer = input.buffer.slice(
		input.byteOffset,
		input.byteOffset + input.byteLength,
	);
	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);

	if (buffer.byteLength < 128) {
		throw new Error(
			"This PCX file could not be decoded. The header is too short.",
		);
	}

	// Parse 128-byte header
	const manufacturer = bytes[0];
	if (manufacturer !== 0x0a) {
		throw new Error(
			"This PCX file could not be decoded. Invalid manufacturer byte.",
		);
	}

	const encoding = bytes[2]; // 1 = RLE
	const bpp = bytes[3]; // bits per pixel per plane
	const xMin = view.getUint16(4, true);
	const yMin = view.getUint16(6, true);
	const xMax = view.getUint16(8, true);
	const yMax = view.getUint16(10, true);
	const nPlanes = bytes[65];
	const bytesPerLine = view.getUint16(66, true);

	const width = xMax - xMin + 1;
	const height = yMax - yMin + 1;

	if (width <= 0 || height <= 0) {
		throw new Error(
			"This PCX file could not be decoded. Image dimensions are invalid.",
		);
	}

	if (encoding !== 0 && encoding !== 1) {
		throw new Error(
			`This PCX file uses an unsupported encoding (${encoding}).`,
		);
	}

	// Total bytes per scanline across all planes
	const scanlineBytes = nPlanes * bytesPerLine;

	// Decode all scanline data (RLE or raw)
	const totalScanlineData = scanlineBytes * height;
	const scanlineData = new Uint8Array(totalScanlineData);
	let srcPos = 128; // pixel data starts after the 128-byte header
	let dstPos = 0;

	if (encoding === 1) {
		// RLE decode
		while (dstPos < totalScanlineData && srcPos < bytes.length) {
			const byte = bytes[srcPos++];
			if (byte >= 0xc0) {
				const count = byte & 0x3f;
				const value = srcPos < bytes.length ? bytes[srcPos++] : 0;
				for (let i = 0; i < count && dstPos < totalScanlineData; i++) {
					scanlineData[dstPos++] = value;
				}
			} else {
				scanlineData[dstPos++] = byte;
			}
		}
	} else {
		// Raw (no encoding)
		const available = Math.min(totalScanlineData, bytes.length - 128);
		scanlineData.set(bytes.subarray(128, 128 + available));
	}

	// Convert to RGBA
	const rgba = new Uint8Array(width * height * 4);

	if (nPlanes === 3 && bpp === 8) {
		// 24-bit RGB: 3 separate planes per scanline
		for (let y = 0; y < height; y++) {
			const lineOffset = y * scanlineBytes;
			for (let x = 0; x < width; x++) {
				const dst = (y * width + x) * 4;
				rgba[dst] = scanlineData[lineOffset + x]; // R plane
				rgba[dst + 1] = scanlineData[lineOffset + bytesPerLine + x]; // G plane
				rgba[dst + 2] = scanlineData[lineOffset + 2 * bytesPerLine + x]; // B plane
				rgba[dst + 3] = 255;
			}
		}
	} else if (nPlanes === 1 && bpp === 8) {
		// 256-color indexed: VGA palette at end of file
		// Last 769 bytes: 0x0C marker + 768 bytes (256 * 3 RGB)
		const paletteOffset = bytes.length - 769;
		if (paletteOffset < 128 || bytes[paletteOffset] !== 0x0c) {
			throw new Error(
				"This PCX file could not be decoded. Missing VGA palette marker.",
			);
		}
		const palette = bytes.subarray(paletteOffset + 1, paletteOffset + 769);

		for (let y = 0; y < height; y++) {
			const lineOffset = y * scanlineBytes;
			for (let x = 0; x < width; x++) {
				const index = scanlineData[lineOffset + x];
				const dst = (y * width + x) * 4;
				rgba[dst] = palette[index * 3];
				rgba[dst + 1] = palette[index * 3 + 1];
				rgba[dst + 2] = palette[index * 3 + 2];
				rgba[dst + 3] = 255;
			}
		}
	} else if (nPlanes === 1 && bpp === 1) {
		// Monochrome: 1 bit per pixel
		for (let y = 0; y < height; y++) {
			const lineOffset = y * scanlineBytes;
			for (let x = 0; x < width; x++) {
				const byteIndex = Math.floor(x / 8);
				const bitIndex = 7 - (x % 8);
				const bit = (scanlineData[lineOffset + byteIndex] >> bitIndex) & 1;
				const color = bit ? 255 : 0;
				const dst = (y * width + x) * 4;
				rgba[dst] = color;
				rgba[dst + 1] = color;
				rgba[dst + 2] = color;
				rgba[dst + 3] = 255;
			}
		}
	} else {
		throw new Error(
			`This PCX file uses an unsupported format (${nPlanes} planes, ${bpp} bpp).`,
		);
	}

	return { data: rgba, width, height };
}
