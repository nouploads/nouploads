import type { ImageData } from "../backend.js";

/**
 * Decode a WBMP (Wireless Bitmap) file to raw RGBA pixels.
 *
 * Custom parser — no external library. WBMP is the simplest image format:
 * - Type byte (must be 0)
 * - Fixed header byte (0)
 * - Width as multi-byte integer (bit 7 = continuation flag)
 * - Height as multi-byte integer
 * - 1 bit per pixel, MSB first. Bit 1 = black, Bit 0 = white.
 */
export async function decodeWbmp(input: Uint8Array): Promise<ImageData> {
	const bytes = input;

	if (bytes.length < 4) {
		throw new Error(
			"This WBMP file could not be decoded. The file is too short.",
		);
	}

	// Byte 0: type (must be 0 for WBMP type 0)
	if (bytes[0] !== 0) {
		throw new Error(`This WBMP file uses an unsupported type (${bytes[0]}).`);
	}

	// Byte 1: fixed header byte (should be 0)
	let pos = 2;

	// Read width as multi-byte integer
	const { value: width, nextPos: posAfterWidth } = readMultiByte(bytes, pos);
	pos = posAfterWidth;

	// Read height as multi-byte integer
	const { value: height, nextPos: posAfterHeight } = readMultiByte(bytes, pos);
	pos = posAfterHeight;

	if (width === 0 || height === 0) {
		throw new Error(
			"This WBMP file could not be decoded. Image dimensions are zero.",
		);
	}

	if (width > 16384 || height > 16384) {
		throw new Error(
			"This WBMP file could not be decoded. Image dimensions exceed 16384.",
		);
	}

	// Each row is ceil(width / 8) bytes
	const rowBytes = Math.ceil(width / 8);
	const expectedDataBytes = rowBytes * height;
	const availableData = bytes.length - pos;

	if (availableData < expectedDataBytes) {
		throw new Error(
			"This WBMP file could not be decoded. Pixel data is truncated.",
		);
	}

	const rgba = new Uint8Array(width * height * 4);

	for (let y = 0; y < height; y++) {
		const rowStart = pos + y * rowBytes;
		for (let x = 0; x < width; x++) {
			const byteIndex = Math.floor(x / 8);
			const bitIndex = 7 - (x % 8);
			const bit = (bytes[rowStart + byteIndex] >> bitIndex) & 1;
			// Bit 1 = black (0,0,0), Bit 0 = white (255,255,255)
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

/**
 * Read a multi-byte integer from WBMP data.
 * Each byte: bit 7 = continuation flag, bits 0-6 = value.
 * Value is built by shifting left 7 and OR-ing each chunk.
 */
function readMultiByte(
	bytes: Uint8Array,
	startPos: number,
): { value: number; nextPos: number } {
	let value = 0;
	let pos = startPos;

	while (pos < bytes.length) {
		const byte = bytes[pos++];
		value = (value << 7) | (byte & 0x7f);
		if ((byte & 0x80) === 0) break;
	}

	return { value, nextPos: pos };
}
