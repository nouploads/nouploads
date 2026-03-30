import type { ImageData } from "../backend.js";

/**
 * Decode an XBM (X BitMap) file to raw RGBA pixels.
 *
 * Custom parser — no external library. XBM is a C source file containing:
 * - `#define <name>_width <N>` and `#define <name>_height <N>` macros
 * - `static unsigned char <name>_bits[] = { 0xFF, 0x00, ... };` data array
 *
 * Each byte stores 8 pixels, LSB first (bit 0 is the leftmost pixel).
 * Bit 1 = foreground (black), bit 0 = background (white).
 * Rows are padded to byte boundaries.
 */
export async function decodeXbm(input: Uint8Array): Promise<ImageData> {
	const text = new TextDecoder("ascii").decode(input);

	// Parse width and height from #define macros
	const widthMatch = text.match(/#define\s+\S+_width\s+(\d+)/);
	const heightMatch = text.match(/#define\s+\S+_height\s+(\d+)/);

	if (!widthMatch || !heightMatch) {
		throw new Error(
			"This XBM file could not be decoded. Missing width or height definition.",
		);
	}

	const width = Number.parseInt(widthMatch[1], 10);
	const height = Number.parseInt(heightMatch[1], 10);

	if (width <= 0 || height <= 0) {
		throw new Error(
			"This XBM file could not be decoded. Image dimensions are invalid.",
		);
	}

	if (width > 16384 || height > 16384) {
		throw new Error(
			"This XBM file could not be decoded. Image dimensions exceed 16384.",
		);
	}

	// Extract hex byte values from the data array
	const hexValues = text.match(/0x[0-9a-fA-F]{1,2}/g);
	if (!hexValues || hexValues.length === 0) {
		throw new Error("This XBM file could not be decoded. No pixel data found.");
	}

	const bytes = new Uint8Array(hexValues.length);
	for (let i = 0; i < hexValues.length; i++) {
		bytes[i] = Number.parseInt(hexValues[i], 16);
	}

	// Each row is padded to byte boundaries
	const bytesPerRow = Math.ceil(width / 8);
	const expectedBytes = bytesPerRow * height;

	if (bytes.length < expectedBytes) {
		throw new Error(
			"This XBM file could not be decoded. Pixel data is truncated.",
		);
	}

	const rgba = new Uint8Array(width * height * 4);

	for (let y = 0; y < height; y++) {
		const rowOffset = y * bytesPerRow;
		for (let x = 0; x < width; x++) {
			const byteIndex = Math.floor(x / 8);
			// LSB first: bit 0 is leftmost pixel in the byte
			const bitIndex = x % 8;
			const bit = (bytes[rowOffset + byteIndex] >> bitIndex) & 1;
			// 1 = foreground (black), 0 = background (white)
			const color = bit ? 0 : 255;
			const dst = (y * width + x) * 4;
			rgba[dst] = color;
			rgba[dst + 1] = color;
			rgba[dst + 2] = color;
			rgba[dst + 3] = 255;
		}
	}

	return { data: rgba, width, height };
}
