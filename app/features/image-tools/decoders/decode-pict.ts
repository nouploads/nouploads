import type { DecodedImage } from "./types";

/**
 * Decode a PICT (Apple QuickDraw) file to raw RGBA pixels.
 *
 * Custom parser — no external library. Strategy:
 * 1. Skip first 512 bytes (legacy resource fork placeholder)
 * 2. Search for embedded JPEG data (0xFF 0xD8 0xFF) — most common case
 * 3. If no JPEG, search for PackBits bitmap in PixMap opcodes (0x0098, 0x009A)
 * 4. If neither found, throw an error
 *
 * JPEG decoding requires createImageBitmap + OffscreenCanvas (browser env).
 */
export async function decodePict(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);

	if (bytes.length < 524) {
		throw new Error(
			"This PICT file could not be decoded. The file is too short.",
		);
	}

	// Skip 512-byte resource fork header
	const data = bytes.slice(512);

	// Strategy 1: Search for embedded JPEG
	const jpegOffset = findJpegStart(data);
	if (jpegOffset !== -1) {
		return decodeEmbeddedJpeg(data, jpegOffset, signal);
	}

	// Strategy 2: Search for PackBits PixMap opcode
	const packBitsResult = decodePackBitsPixMap(data);
	if (packBitsResult) {
		return packBitsResult;
	}

	throw new Error("This PICT file uses unsupported QuickDraw features.");
}

/**
 * Find the byte offset of the first JPEG SOI marker (0xFF 0xD8 0xFF).
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

/**
 * Decode embedded JPEG data using the browser's native decoder.
 */
async function decodeEmbeddedJpeg(
	data: Uint8Array,
	jpegOffset: number,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	const jpegData = data.slice(jpegOffset);
	const jpegBlob = new Blob([jpegData], { type: "image/jpeg" });

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bitmap = await createImageBitmap(jpegBlob);

	if (signal?.aborted) {
		bitmap.close();
		throw new DOMException("Aborted", "AbortError");
	}

	const { width, height } = bitmap;
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
 * Search for PackBits PixMap opcodes (0x0098 or 0x009A) and decode the bitmap.
 * Returns null if no PackBits data found.
 */
function decodePackBitsPixMap(data: Uint8Array): DecodedImage | null {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

	// Search for opcode 0x0098 (PackBitsRect) or 0x009A (DirectBitsRect)
	for (let i = 0; i < data.length - 50; i++) {
		const opcode = view.getUint16(i, false);
		if (opcode !== 0x0098 && opcode !== 0x009a) continue;

		try {
			return parsePixMapData(data, view, i + 2, opcode);
		} catch {}
	}

	return null;
}

/**
 * Parse PixMap data structure and decompress PackBits scanlines.
 */
function parsePixMapData(
	data: Uint8Array,
	view: DataView,
	offset: number,
	opcode: number,
): DecodedImage {
	let pos = offset;

	// For DirectBitsRect (0x009A), skip the baseAddr (4 bytes)
	if (opcode === 0x009a) {
		pos += 4;
	}

	// rowBytes — high bit may be set to indicate PixMap vs BitMap
	const rowBytesRaw = view.getUint16(pos, false);
	const rowBytes = rowBytesRaw & 0x3fff;
	pos += 2;

	// Bounds rect: top, left, bottom, right
	const top = view.getInt16(pos, false);
	pos += 2;
	const left = view.getInt16(pos, false);
	pos += 2;
	const bottom = view.getInt16(pos, false);
	pos += 2;
	const right = view.getInt16(pos, false);
	pos += 2;

	const width = right - left;
	const height = bottom - top;

	if (width <= 0 || height <= 0 || width > 16384 || height > 16384) {
		throw new Error("Invalid PixMap dimensions.");
	}

	// Skip version, packType, packSize, hRes, vRes, pixelType
	pos += 2 + 2 + 4 + 4 + 4 + 2;

	const pixelSize = view.getUint16(pos, false);
	pos += 2;

	const cmpCount = view.getUint16(pos, false);
	pos += 2;

	// Skip cmpSize, planeBytes, pmTable, pmReserved
	pos += 2 + 4 + 4 + 4;

	// For indexed color, skip the color table
	if (pixelSize <= 8) {
		// Color table: seed(4) + flags(2) + count(2) + entries
		pos += 4 + 2;
		const ctSize = view.getUint16(pos, false);
		pos += 2;
		// Each entry: value(2) + r(2) + g(2) + b(2) = 8 bytes
		pos += (ctSize + 1) * 8;
	}

	// Skip srcRect, dstRect, transferMode
	pos += 4 * 2 + 4 * 2 + 2;

	// Decompress PackBits scanlines
	const rgba = new Uint8Array(width * height * 4);

	for (let y = 0; y < height; y++) {
		// Read packed scanline length
		let packedLength: number;
		if (rowBytes > 250) {
			packedLength = view.getUint16(pos, false);
			pos += 2;
		} else {
			packedLength = data[pos++];
		}

		if (pos + packedLength > data.length) {
			throw new Error("PackBits data truncated.");
		}

		const scanline = decompressPackBits(data, pos, packedLength, rowBytes);
		pos += packedLength;

		// Convert scanline to RGBA
		for (let x = 0; x < width; x++) {
			const dst = (y * width + x) * 4;

			if (pixelSize === 32 && cmpCount >= 3) {
				// 4 components: skip alpha byte, then R, G, B
				const planeBytes = rowBytes / cmpCount;
				rgba[dst] = scanline[planeBytes + x] ?? 0;
				rgba[dst + 1] = scanline[2 * planeBytes + x] ?? 0;
				rgba[dst + 2] = scanline[3 * planeBytes + x] ?? 0;
				rgba[dst + 3] = 255;
			} else if (pixelSize === 16) {
				// 5-5-5 RGB packed into 2 bytes (big-endian)
				const srcOff = x * 2;
				const hi = scanline[srcOff] ?? 0;
				const lo = scanline[srcOff + 1] ?? 0;
				const val = (hi << 8) | lo;
				rgba[dst] = ((val >> 10) & 0x1f) * 8;
				rgba[dst + 1] = ((val >> 5) & 0x1f) * 8;
				rgba[dst + 2] = (val & 0x1f) * 8;
				rgba[dst + 3] = 255;
			} else {
				// 8-bit or other — treat as grayscale fallback
				const gray = scanline[x] ?? 0;
				rgba[dst] = gray;
				rgba[dst + 1] = gray;
				rgba[dst + 2] = gray;
				rgba[dst + 3] = 255;
			}
		}
	}

	return { data: rgba, width, height };
}

/**
 * Decompress a PackBits-compressed scanline.
 *
 * PackBits encoding:
 * - n (0-127): copy next n+1 literal bytes
 * - n (129-255, i.e. -127 to -1 as signed): repeat next byte (-n+1) times
 * - n = 128: no-op
 */
function decompressPackBits(
	src: Uint8Array,
	offset: number,
	packedLength: number,
	outputLength: number,
): Uint8Array {
	const out = new Uint8Array(outputLength);
	let srcPos = offset;
	const srcEnd = offset + packedLength;
	let dstPos = 0;

	while (srcPos < srcEnd && dstPos < outputLength) {
		const n = src[srcPos++];

		if (n < 128) {
			// Copy n+1 literal bytes
			const count = n + 1;
			for (let i = 0; i < count && dstPos < outputLength; i++) {
				out[dstPos++] = src[srcPos++];
			}
		} else if (n > 128) {
			// Repeat next byte (257 - n) times
			const count = 257 - n;
			const value = src[srcPos++];
			for (let i = 0; i < count && dstPos < outputLength; i++) {
				out[dstPos++] = value;
			}
		}
		// n === 128: no-op
	}

	return out;
}
