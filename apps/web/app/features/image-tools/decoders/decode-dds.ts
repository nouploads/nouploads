import type { DecodedImage } from "./types";

/**
 * Decode a DDS (DirectDraw Surface) file to raw RGBA pixels.
 *
 * Custom parser — no external library. Handles:
 * - DXT1 (BC1): 4x4 blocks, 8 bytes each, optional 1-bit alpha
 * - DXT3 (BC2): 4x4 blocks, 16 bytes each, explicit 4-bit alpha
 * - DXT5 (BC3): 4x4 blocks, 16 bytes each, interpolated alpha
 * - Uncompressed RGBA (fourCC=0, 32bpp): bitmask-based channel extraction
 *
 * Only decodes mip level 0. For cubemaps, takes only the first face.
 */
export async function decodeDds(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);

	// Minimum: 4 magic + 124 header = 128 bytes
	if (buffer.byteLength < 128) {
		throw new Error(
			"This DDS file could not be decoded. The file is too short.",
		);
	}

	// Validate magic number: "DDS " = 0x20534444
	const magic = view.getUint32(0, true);
	if (magic !== 0x20534444) {
		throw new Error(
			"This DDS file could not be decoded. Invalid magic number.",
		);
	}

	// Parse header (starts at offset 4)
	const headerSize = view.getUint32(4, true);
	if (headerSize !== 124) {
		throw new Error(
			"This DDS file could not be decoded. Unexpected header size.",
		);
	}

	const height = view.getUint32(16, true);
	const width = view.getUint32(20, true);

	if (width === 0 || height === 0) {
		throw new Error(
			"This DDS file could not be decoded. Image dimensions are zero.",
		);
	}

	// Pixel format struct starts at offset 4 + 72 = 76
	// fourCC at offset 4 + 80 = 84
	const fourCC = String.fromCharCode(
		bytes[88],
		bytes[89],
		bytes[90],
		bytes[91],
	);
	const fourCCRaw = view.getUint32(88, true);
	const rgbBitCount = view.getUint32(92, true);
	const rMask = view.getUint32(96, true);
	const gMask = view.getUint32(100, true);
	const bMask = view.getUint32(104, true);
	const aMask = view.getUint32(108, true);

	const dataOffset = 128;
	const pixelData = bytes.subarray(dataOffset);

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let rgba: Uint8Array;

	if (fourCC === "DXT1") {
		rgba = decodeDxt1(pixelData, width, height);
	} else if (fourCC === "DXT3") {
		rgba = decodeDxt3(pixelData, width, height);
	} else if (fourCC === "DXT5") {
		rgba = decodeDxt5(pixelData, width, height);
	} else if (fourCCRaw === 0 && rgbBitCount === 32) {
		rgba = decodeUncompressedRgba(
			pixelData,
			width,
			height,
			rMask,
			gMask,
			bMask,
			aMask,
		);
	} else {
		throw new Error(
			`This DDS file uses an unsupported format (fourCC: "${fourCC}", bits: ${rgbBitCount}).`,
		);
	}

	return { data: rgba, width, height };
}

/* ------------------------------------------------------------------ */
/*  RGB565 helper                                                      */
/* ------------------------------------------------------------------ */

function decodeRgb565(value: number): [number, number, number] {
	const r = (((value >> 11) & 0x1f) * 255) / 31;
	const g = (((value >> 5) & 0x3f) * 255) / 63;
	const b = ((value & 0x1f) * 255) / 31;
	return [Math.round(r), Math.round(g), Math.round(b)];
}

/* ------------------------------------------------------------------ */
/*  DXT1 (BC1) decoder                                                 */
/* ------------------------------------------------------------------ */

function decodeDxt1(
	data: Uint8Array,
	width: number,
	height: number,
): Uint8Array {
	const rgba = new Uint8Array(width * height * 4);
	const blocksX = Math.ceil(width / 4);
	const blocksY = Math.ceil(height / 4);
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	let offset = 0;

	for (let by = 0; by < blocksY; by++) {
		for (let bx = 0; bx < blocksX; bx++) {
			if (offset + 8 > data.byteLength) break;

			const color0 = view.getUint16(offset, true);
			const color1 = view.getUint16(offset + 2, true);
			const indices = view.getUint32(offset + 4, true);
			offset += 8;

			const c0 = decodeRgb565(color0);
			const c1 = decodeRgb565(color1);

			const palette: [number, number, number, number][] = [
				[c0[0], c0[1], c0[2], 255],
				[c1[0], c1[1], c1[2], 255],
				[0, 0, 0, 255],
				[0, 0, 0, 255],
			];

			if (color0 > color1) {
				palette[2] = [
					Math.round((2 * c0[0] + c1[0]) / 3),
					Math.round((2 * c0[1] + c1[1]) / 3),
					Math.round((2 * c0[2] + c1[2]) / 3),
					255,
				];
				palette[3] = [
					Math.round((c0[0] + 2 * c1[0]) / 3),
					Math.round((c0[1] + 2 * c1[1]) / 3),
					Math.round((c0[2] + 2 * c1[2]) / 3),
					255,
				];
			} else {
				palette[2] = [
					Math.round((c0[0] + c1[0]) / 2),
					Math.round((c0[1] + c1[1]) / 2),
					Math.round((c0[2] + c1[2]) / 2),
					255,
				];
				palette[3] = [0, 0, 0, 0]; // transparent black
			}

			writeBlockPixels(rgba, width, height, bx, by, indices, palette);
		}
	}

	return rgba;
}

/* ------------------------------------------------------------------ */
/*  DXT3 (BC2) decoder                                                 */
/* ------------------------------------------------------------------ */

function decodeDxt3(
	data: Uint8Array,
	width: number,
	height: number,
): Uint8Array {
	const rgba = new Uint8Array(width * height * 4);
	const blocksX = Math.ceil(width / 4);
	const blocksY = Math.ceil(height / 4);
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	let offset = 0;

	for (let by = 0; by < blocksY; by++) {
		for (let bx = 0; bx < blocksX; bx++) {
			if (offset + 16 > data.byteLength) break;

			// First 8 bytes: explicit 4-bit alpha for 16 pixels
			const alphaBytes = data.subarray(offset, offset + 8);
			offset += 8;

			// Next 8 bytes: DXT1 color block (always opaque mode)
			const color0 = view.getUint16(offset, true);
			const color1 = view.getUint16(offset + 2, true);
			const indices = view.getUint32(offset + 4, true);
			offset += 8;

			const c0 = decodeRgb565(color0);
			const c1 = decodeRgb565(color1);

			const palette: [number, number, number, number][] = [
				[c0[0], c0[1], c0[2], 255],
				[c1[0], c1[1], c1[2], 255],
				[
					Math.round((2 * c0[0] + c1[0]) / 3),
					Math.round((2 * c0[1] + c1[1]) / 3),
					Math.round((2 * c0[2] + c1[2]) / 3),
					255,
				],
				[
					Math.round((c0[0] + 2 * c1[0]) / 3),
					Math.round((c0[1] + 2 * c1[1]) / 3),
					Math.round((c0[2] + 2 * c1[2]) / 3),
					255,
				],
			];

			// Write pixels with explicit alpha
			for (let py = 0; py < 4; py++) {
				for (let px = 0; px < 4; px++) {
					const x = bx * 4 + px;
					const y = by * 4 + py;
					if (x >= width || y >= height) continue;

					const pixelIndex = py * 4 + px;
					const colorIndex = (indices >> (pixelIndex * 2)) & 0x03;
					const color = palette[colorIndex];

					// Extract 4-bit alpha
					const alphaByteIndex = py * 2 + (px >> 1);
					const alphaNibble =
						px & 1
							? (alphaBytes[alphaByteIndex] >> 4) & 0x0f
							: alphaBytes[alphaByteIndex] & 0x0f;
					const alpha = Math.round((alphaNibble * 255) / 15);

					const dst = (y * width + x) * 4;
					rgba[dst] = color[0];
					rgba[dst + 1] = color[1];
					rgba[dst + 2] = color[2];
					rgba[dst + 3] = alpha;
				}
			}
		}
	}

	return rgba;
}

/* ------------------------------------------------------------------ */
/*  DXT5 (BC3) decoder                                                 */
/* ------------------------------------------------------------------ */

function decodeDxt5(
	data: Uint8Array,
	width: number,
	height: number,
): Uint8Array {
	const rgba = new Uint8Array(width * height * 4);
	const blocksX = Math.ceil(width / 4);
	const blocksY = Math.ceil(height / 4);
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	let offset = 0;

	for (let by = 0; by < blocksY; by++) {
		for (let bx = 0; bx < blocksX; bx++) {
			if (offset + 16 > data.byteLength) break;

			// First 8 bytes: interpolated alpha block
			const alpha0 = data[offset];
			const alpha1 = data[offset + 1];

			// 6 bytes of 3-bit indices (48 bits for 16 pixels)
			const alphaBits =
				BigInt(data[offset + 2]) |
				(BigInt(data[offset + 3]) << 8n) |
				(BigInt(data[offset + 4]) << 16n) |
				(BigInt(data[offset + 5]) << 24n) |
				(BigInt(data[offset + 6]) << 32n) |
				(BigInt(data[offset + 7]) << 40n);
			offset += 8;

			// Build alpha palette
			const alphaTable = new Uint8Array(8);
			alphaTable[0] = alpha0;
			alphaTable[1] = alpha1;
			if (alpha0 > alpha1) {
				alphaTable[2] = Math.round((6 * alpha0 + 1 * alpha1) / 7);
				alphaTable[3] = Math.round((5 * alpha0 + 2 * alpha1) / 7);
				alphaTable[4] = Math.round((4 * alpha0 + 3 * alpha1) / 7);
				alphaTable[5] = Math.round((3 * alpha0 + 4 * alpha1) / 7);
				alphaTable[6] = Math.round((2 * alpha0 + 5 * alpha1) / 7);
				alphaTable[7] = Math.round((1 * alpha0 + 6 * alpha1) / 7);
			} else {
				alphaTable[2] = Math.round((4 * alpha0 + 1 * alpha1) / 5);
				alphaTable[3] = Math.round((3 * alpha0 + 2 * alpha1) / 5);
				alphaTable[4] = Math.round((2 * alpha0 + 3 * alpha1) / 5);
				alphaTable[5] = Math.round((1 * alpha0 + 4 * alpha1) / 5);
				alphaTable[6] = 0;
				alphaTable[7] = 255;
			}

			// Next 8 bytes: DXT1 color block (always opaque mode)
			const color0 = view.getUint16(offset, true);
			const color1 = view.getUint16(offset + 2, true);
			const indices = view.getUint32(offset + 4, true);
			offset += 8;

			const c0 = decodeRgb565(color0);
			const c1 = decodeRgb565(color1);

			const palette: [number, number, number, number][] = [
				[c0[0], c0[1], c0[2], 255],
				[c1[0], c1[1], c1[2], 255],
				[
					Math.round((2 * c0[0] + c1[0]) / 3),
					Math.round((2 * c0[1] + c1[1]) / 3),
					Math.round((2 * c0[2] + c1[2]) / 3),
					255,
				],
				[
					Math.round((c0[0] + 2 * c1[0]) / 3),
					Math.round((c0[1] + 2 * c1[1]) / 3),
					Math.round((c0[2] + 2 * c1[2]) / 3),
					255,
				],
			];

			// Write pixels with interpolated alpha
			for (let py = 0; py < 4; py++) {
				for (let px = 0; px < 4; px++) {
					const x = bx * 4 + px;
					const y = by * 4 + py;
					if (x >= width || y >= height) continue;

					const pixelIndex = py * 4 + px;
					const colorIndex = (indices >> (pixelIndex * 2)) & 0x03;
					const color = palette[colorIndex];

					const alphaIndex = Number(
						(alphaBits >> BigInt(pixelIndex * 3)) & 0x07n,
					);
					const alpha = alphaTable[alphaIndex];

					const dst = (y * width + x) * 4;
					rgba[dst] = color[0];
					rgba[dst + 1] = color[1];
					rgba[dst + 2] = color[2];
					rgba[dst + 3] = alpha;
				}
			}
		}
	}

	return rgba;
}

/* ------------------------------------------------------------------ */
/*  Uncompressed RGBA decoder                                          */
/* ------------------------------------------------------------------ */

function decodeUncompressedRgba(
	data: Uint8Array,
	width: number,
	height: number,
	rMask: number,
	gMask: number,
	bMask: number,
	aMask: number,
): Uint8Array {
	const rgba = new Uint8Array(width * height * 4);
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const expectedBytes = width * height * 4;

	if (data.byteLength < expectedBytes) {
		throw new Error(
			"This DDS file could not be decoded. Pixel data is truncated.",
		);
	}

	const rShift = countTrailingZeros(rMask);
	const gShift = countTrailingZeros(gMask);
	const bShift = countTrailingZeros(bMask);
	const aShift = countTrailingZeros(aMask);
	const rMax = rMask >>> rShift;
	const gMax = gMask >>> gShift;
	const bMax = bMask >>> bShift;
	const aMax = aMask >>> aShift;

	for (let i = 0; i < width * height; i++) {
		const pixel = view.getUint32(i * 4, true);
		const dst = i * 4;

		rgba[dst] =
			rMax > 0 ? Math.round((((pixel & rMask) >>> rShift) * 255) / rMax) : 0;
		rgba[dst + 1] =
			gMax > 0 ? Math.round((((pixel & gMask) >>> gShift) * 255) / gMax) : 0;
		rgba[dst + 2] =
			bMax > 0 ? Math.round((((pixel & bMask) >>> bShift) * 255) / bMax) : 0;
		rgba[dst + 3] =
			aMax > 0 ? Math.round((((pixel & aMask) >>> aShift) * 255) / aMax) : 255;
	}

	return rgba;
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Write a 4x4 block of pixels into the RGBA output buffer.
 * Used by DXT1 which has a simple palette + 2-bit index table.
 */
function writeBlockPixels(
	rgba: Uint8Array,
	width: number,
	height: number,
	bx: number,
	by: number,
	indices: number,
	palette: [number, number, number, number][],
): void {
	for (let py = 0; py < 4; py++) {
		for (let px = 0; px < 4; px++) {
			const x = bx * 4 + px;
			const y = by * 4 + py;
			if (x >= width || y >= height) continue;

			const pixelIndex = py * 4 + px;
			const colorIndex = (indices >> (pixelIndex * 2)) & 0x03;
			const color = palette[colorIndex];

			const dst = (y * width + x) * 4;
			rgba[dst] = color[0];
			rgba[dst + 1] = color[1];
			rgba[dst + 2] = color[2];
			rgba[dst + 3] = color[3];
		}
	}
}

/**
 * Count trailing zero bits in a 32-bit unsigned integer.
 * Returns 0 for input 0 (no shift needed when mask is absent).
 */
function countTrailingZeros(n: number): number {
	if (n === 0) return 0;
	let count = 0;
	let v = n >>> 0;
	while ((v & 1) === 0) {
		count++;
		v >>>= 1;
	}
	return count;
}
