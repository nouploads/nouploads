import type { DecodedImage } from "./types";

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
export async function decodeIcns(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

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

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Collect PNG entries sorted by size (largest first)
	const pngEntries = entries
		.filter((e) => e.tag in PNG_TAGS && isPng(e.data))
		.sort((a, b) => (PNG_TAGS[b.tag] ?? 0) - (PNG_TAGS[a.tag] ?? 0));

	// Try the largest PNG entry first
	if (pngEntries.length > 0) {
		return decodePngEntry(pngEntries[0].data, signal);
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
 * Decode a PNG-embedded ICNS entry via createImageBitmap → canvas → ImageData.
 */
async function decodePngEntry(
	pngData: Uint8Array,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	const blob = new Blob([pngData as BlobPart], { type: "image/png" });
	const bitmap = await createImageBitmap(blob);

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
): DecodedImage {
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
