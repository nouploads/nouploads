import type { ImageData } from "../backend.js";

/** ICNS file magic: "icns" */
const ICNS_MAGIC = 0x69636e73;

/** Modern PNG-based entry tags → nominal pixel dimensions */
const PNG_TAGS: Record<string, number> = {
	ic07: 128,
	ic08: 256,
	ic09: 512,
	ic10: 1024,
	ic11: 32, // 32x32@2x
	ic12: 64, // 64x64@2x
	ic13: 256, // 256x256@2x
	ic14: 512, // 512x512@2x
};

/** Legacy 32-bit ARGB entry tags → pixel dimensions */
const ARGB_TAGS: Record<string, number> = {
	it32: 128,
	ih32: 48,
	il32: 32,
	is32: 16,
};

interface IcnsEntry {
	tag: string;
	data: Uint8Array;
}

/**
 * Decode an Apple ICNS file to raw RGBA pixels.
 *
 * Custom parser — no external library. Handles:
 * - Modern PNG-embedded entries (ic07–ic14)
 * - Legacy 32-bit ARGB entries with optional PackBits compression (it32, ih32, il32, is32)
 * - Legacy 8-bit alpha masks (t8mk, h8mk, l8mk, s8mk)
 *
 * Picks the largest available entry, preferring PNG over ARGB.
 */
export async function decodeIcns(input: Uint8Array): Promise<ImageData> {
	const buffer = input.buffer.slice(
		input.byteOffset,
		input.byteOffset + input.byteLength,
	);

	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	if (buffer.byteLength < 8) {
		throw new Error(
			"This ICNS file could not be decoded. The header is too short.",
		);
	}

	// Validate magic
	const magic = view.getUint32(0, false);
	if (magic !== ICNS_MAGIC) {
		throw new Error(
			"This ICNS file could not be decoded. Invalid magic bytes.",
		);
	}

	const totalSize = view.getUint32(4, false);
	if (totalSize > buffer.byteLength) {
		throw new Error(
			"This ICNS file could not be decoded. Declared size exceeds data.",
		);
	}

	// Parse entries
	const entries: IcnsEntry[] = [];
	let offset = 8;

	while (offset + 8 <= totalSize) {
		const tag = String.fromCharCode(
			bytes[offset],
			bytes[offset + 1],
			bytes[offset + 2],
			bytes[offset + 3],
		);
		const entrySize = view.getUint32(offset + 4, false);

		if (entrySize < 8 || offset + entrySize > totalSize) break;

		const data = bytes.slice(offset + 8, offset + entrySize);
		entries.push({ tag, data });
		offset += entrySize;
	}

	if (entries.length === 0) {
		throw new Error(
			"This ICNS file could not be decoded. No valid entries found.",
		);
	}

	// Collect PNG entries sorted by size (largest first)
	const pngEntries = entries
		.filter((e) => e.tag in PNG_TAGS && isPng(e.data))
		.sort((a, b) => (PNG_TAGS[b.tag] ?? 0) - (PNG_TAGS[a.tag] ?? 0));

	// Try the largest PNG entry first
	if (pngEntries.length > 0) {
		return decodePngEntry(pngEntries[0].data);
	}

	// Fall back to legacy ARGB entries
	const argbEntries = entries
		.filter((e) => e.tag in ARGB_TAGS)
		.sort((a, b) => (ARGB_TAGS[b.tag] ?? 0) - (ARGB_TAGS[a.tag] ?? 0));

	if (argbEntries.length === 0) {
		throw new Error(
			"This ICNS file could not be decoded. No supported image entries found.",
		);
	}

	const bestArgb = argbEntries[0];
	const dim = ARGB_TAGS[bestArgb.tag];

	// Find matching mask entry
	const maskTag = findMaskTag(bestArgb.tag);
	const maskEntry = maskTag
		? entries.find((e) => e.tag === maskTag)
		: undefined;

	return decodeArgbEntry(bestArgb.data, dim, maskEntry?.data);
}

/** Check if data starts with PNG magic bytes. */
function isPng(data: Uint8Array): boolean {
	if (data.length < 4) return false;
	return (
		data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47
	);
}

/** Map ARGB tag to its corresponding mask tag. */
function findMaskTag(argbTag: string): string | undefined {
	const map: Record<string, string> = {
		it32: "t8mk",
		ih32: "h8mk",
		il32: "l8mk",
		is32: "s8mk",
	};
	return map[argbTag];
}

/**
 * Decode a PNG-embedded ICNS entry using a pure-JS PNG parser.
 * Parses IHDR for dimensions/color type, decompresses IDAT chunks via fflate,
 * reverses PNG filtering, and converts to RGBA.
 */
async function decodePngEntry(pngData: Uint8Array): Promise<ImageData> {
	const fflate = await import("fflate");

	// Validate PNG signature
	if (pngData.length < 8 || !isPng(pngData)) {
		throw new Error("Invalid PNG data in ICNS entry.");
	}

	let pos = 8; // skip signature
	let width = 0;
	let height = 0;
	let bitDepth = 0;
	let colorType = 0;
	const idatChunks: Uint8Array[] = [];

	while (pos + 8 <= pngData.length) {
		const chunkLen =
			((pngData[pos] << 24) |
				(pngData[pos + 1] << 16) |
				(pngData[pos + 2] << 8) |
				pngData[pos + 3]) >>>
			0;
		const chunkType = String.fromCharCode(
			pngData[pos + 4],
			pngData[pos + 5],
			pngData[pos + 6],
			pngData[pos + 7],
		);
		pos += 8;

		if (pos + chunkLen > pngData.length) break;

		if (chunkType === "IHDR" && chunkLen >= 13) {
			width =
				((pngData[pos] << 24) |
					(pngData[pos + 1] << 16) |
					(pngData[pos + 2] << 8) |
					pngData[pos + 3]) >>>
				0;
			height =
				((pngData[pos + 4] << 24) |
					(pngData[pos + 5] << 16) |
					(pngData[pos + 6] << 8) |
					pngData[pos + 7]) >>>
				0;
			bitDepth = pngData[pos + 8];
			colorType = pngData[pos + 9];
		} else if (chunkType === "IDAT") {
			idatChunks.push(pngData.slice(pos, pos + chunkLen));
		} else if (chunkType === "IEND") {
			break;
		}

		pos += chunkLen + 4; // skip data + CRC
	}

	if (width === 0 || height === 0) {
		throw new Error("Invalid PNG: missing IHDR.");
	}
	if (idatChunks.length === 0) {
		throw new Error("Invalid PNG: no IDAT chunks.");
	}

	// Concatenate IDAT chunks and decompress
	const totalIdatLen = idatChunks.reduce((s, c) => s + c.length, 0);
	const idatConcat = new Uint8Array(totalIdatLen);
	let idatOff = 0;
	for (const chunk of idatChunks) {
		idatConcat.set(chunk, idatOff);
		idatOff += chunk.length;
	}

	const decompressed = fflate.inflateSync(idatConcat);

	// Determine bytes per pixel based on color type and bit depth
	let channels: number;
	switch (colorType) {
		case 0:
			channels = 1;
			break; // Grayscale
		case 2:
			channels = 3;
			break; // RGB
		case 4:
			channels = 2;
			break; // Grayscale + Alpha
		case 6:
			channels = 4;
			break; // RGBA
		default:
			throw new Error(`Unsupported PNG color type ${colorType} in ICNS entry.`);
	}

	const bytesPerChannel = bitDepth <= 8 ? 1 : 2;
	const bpp = channels * bytesPerChannel;
	const scanlineBytes = width * bpp;

	// Reverse PNG filtering
	const filtered = new Uint8Array(width * height * bpp);
	let dPos = 0;
	let sPos = 0;

	for (let y = 0; y < height; y++) {
		if (sPos >= decompressed.length) break;
		const filterType = decompressed[sPos++];
		const rowStart = dPos;
		const prevRowStart = rowStart - scanlineBytes;

		for (let x = 0; x < scanlineBytes; x++) {
			const raw = sPos < decompressed.length ? decompressed[sPos++] : 0;
			const a = x >= bpp ? filtered[dPos - bpp] : 0;
			const b = y > 0 ? filtered[prevRowStart + x] : 0;
			const c = y > 0 && x >= bpp ? filtered[prevRowStart + x - bpp] : 0;

			let value: number;
			switch (filterType) {
				case 0:
					value = raw;
					break; // None
				case 1:
					value = (raw + a) & 0xff;
					break; // Sub
				case 2:
					value = (raw + b) & 0xff;
					break; // Up
				case 3:
					value = (raw + ((a + b) >> 1)) & 0xff;
					break; // Average
				case 4:
					value = (raw + paethPredictor(a, b, c)) & 0xff;
					break; // Paeth
				default:
					value = raw;
			}

			filtered[dPos++] = value;
		}
	}

	// Convert to RGBA8
	const rgba = new Uint8Array(width * height * 4);

	for (let i = 0; i < width * height; i++) {
		const si = i * bpp;
		const di = i * 4;

		if (bitDepth === 16) {
			// Scale 16-bit to 8-bit
			switch (colorType) {
				case 0: // Grayscale 16-bit
					rgba[di] = rgba[di + 1] = rgba[di + 2] = filtered[si];
					rgba[di + 3] = 255;
					break;
				case 2: // RGB 16-bit
					rgba[di] = filtered[si];
					rgba[di + 1] = filtered[si + 2];
					rgba[di + 2] = filtered[si + 4];
					rgba[di + 3] = 255;
					break;
				case 4: // Grayscale+Alpha 16-bit
					rgba[di] = rgba[di + 1] = rgba[di + 2] = filtered[si];
					rgba[di + 3] = filtered[si + 2];
					break;
				case 6: // RGBA 16-bit
					rgba[di] = filtered[si];
					rgba[di + 1] = filtered[si + 2];
					rgba[di + 2] = filtered[si + 4];
					rgba[di + 3] = filtered[si + 6];
					break;
			}
		} else {
			// 8-bit
			switch (colorType) {
				case 0: // Grayscale
					rgba[di] = rgba[di + 1] = rgba[di + 2] = filtered[si];
					rgba[di + 3] = 255;
					break;
				case 2: // RGB
					rgba[di] = filtered[si];
					rgba[di + 1] = filtered[si + 1];
					rgba[di + 2] = filtered[si + 2];
					rgba[di + 3] = 255;
					break;
				case 4: // Grayscale+Alpha
					rgba[di] = rgba[di + 1] = rgba[di + 2] = filtered[si];
					rgba[di + 3] = filtered[si + 1];
					break;
				case 6: // RGBA
					rgba[di] = filtered[si];
					rgba[di + 1] = filtered[si + 1];
					rgba[di + 2] = filtered[si + 2];
					rgba[di + 3] = filtered[si + 3];
					break;
			}
		}
	}

	return { data: rgba, width, height };
}

/** Paeth predictor function used in PNG filtering. */
function paethPredictor(a: number, b: number, c: number): number {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);
	if (pa <= pb && pa <= pc) return a;
	if (pb <= pc) return b;
	return c;
}

/**
 * Decode a legacy 32-bit ARGB entry.
 *
 * Data is channel-interleaved: all A bytes, then all R, all G, all B.
 * May be PackBits compressed (Apple variant).
 */
function decodeArgbEntry(
	data: Uint8Array,
	dim: number,
	maskData?: Uint8Array,
): ImageData {
	const pixelCount = dim * dim;
	const expectedRaw = pixelCount * 4; // 4 channels

	let channels: Uint8Array;

	if (data.length === expectedRaw) {
		// Uncompressed: raw ARGB channel data
		channels = data;
	} else {
		// PackBits compressed
		channels = decompressPackBits(data, expectedRaw);
	}

	// Deinterleave: ARGB channels → RGBA pixel array
	const rgba = new Uint8Array(pixelCount * 4);

	for (let i = 0; i < pixelCount; i++) {
		const a = channels[i]; // A channel
		const r = channels[pixelCount + i]; // R channel
		const g = channels[pixelCount * 2 + i]; // G channel
		const b = channels[pixelCount * 3 + i]; // B channel

		const dst = i * 4;
		rgba[dst] = r;
		rgba[dst + 1] = g;
		rgba[dst + 2] = b;
		rgba[dst + 3] = a;
	}

	// Apply external mask if available (overrides the A channel)
	if (maskData) {
		const maskSize = dim * dim;
		const mask =
			maskData.length === maskSize
				? maskData
				: decompressPackBits(maskData, maskSize);

		for (let i = 0; i < pixelCount; i++) {
			rgba[i * 4 + 3] = mask[i];
		}
	}

	return { data: rgba, width: dim, height: dim };
}

/**
 * PackBits decompression (Apple ICNS variant).
 *
 * - n < 128:  copy the next (n + 1) literal bytes
 * - n > 128:  repeat the next byte (257 - n) times
 * - n === 128: noop (skip)
 */
function decompressPackBits(src: Uint8Array, expectedLen: number): Uint8Array {
	const out = new Uint8Array(expectedLen);
	let srcPos = 0;
	let dstPos = 0;

	while (dstPos < expectedLen && srcPos < src.length) {
		const n = src[srcPos++];

		if (n < 128) {
			// Literal run: copy (n + 1) bytes
			const count = n + 1;
			for (let i = 0; i < count && dstPos < expectedLen; i++) {
				out[dstPos++] = srcPos < src.length ? src[srcPos++] : 0;
			}
		} else if (n > 128) {
			// Repeat run: repeat next byte (257 - n) times
			const count = 257 - n;
			const value = srcPos < src.length ? src[srcPos++] : 0;
			for (let i = 0; i < count && dstPos < expectedLen; i++) {
				out[dstPos++] = value;
			}
		}
		// n === 128: noop
	}

	return out;
}
