import type { ImageData } from "../backend.js";

/**
 * Decode an OpenEXR (.exr) file to raw RGBA pixels.
 *
 * Custom parser — uses fflate for ZIP decompression.
 * Supports:
 * - Uncompressed (compression 0)
 * - ZIPS (compression 2) — one scanline per chunk
 * - ZIP  (compression 3) — up to 16 scanlines per chunk
 * - HALF (16-bit float), FLOAT (32-bit float), UINT (32-bit uint) channels
 * - Reinhard tone mapping from HDR to 8-bit sRGB
 *
 * Unsupported compressions (RLE=1, PIZ=4, PXR24=5, B44=6, B44A=7, DWAA/DWAB)
 * throw a clear error.
 */
export async function decodeExr(input: Uint8Array): Promise<ImageData> {
	const buffer = input.buffer.slice(
		input.byteOffset,
		input.byteOffset + input.byteLength,
	);

	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	if (buffer.byteLength < 8) {
		throw new Error(
			"This EXR file could not be decoded. The file is too small.",
		);
	}

	/* ---- 1. Magic number ---- */
	const magic = view.getUint32(0, true);
	if (magic !== 0x01312f76) {
		throw new Error(
			"This EXR file could not be decoded. Invalid magic number.",
		);
	}

	/* ---- 2. Version field ---- */
	const versionField = view.getUint32(4, true);
	const version = versionField & 0xff;
	const isTiled = (versionField & 0x200) !== 0;

	if (version !== 2) {
		throw new Error(
			`This EXR file could not be decoded. Unsupported version (${version}).`,
		);
	}
	if (isTiled) {
		throw new Error(
			"This EXR file could not be decoded. Tiled EXR is not supported — only scanline images are handled.",
		);
	}

	/* ---- 3. Parse header attributes ---- */
	let cursor = 8;
	let compression = -1;
	let dataWindow: [number, number, number, number] | null = null;
	const channels: ExrChannel[] = [];

	while (cursor < bytes.length) {
		// Read attribute name (null-terminated)
		const nameStart = cursor;
		while (cursor < bytes.length && bytes[cursor] !== 0) cursor++;
		const attrName = textDecode(bytes, nameStart, cursor);
		cursor++; // skip null

		// Empty name means end of header
		if (attrName === "") break;

		// Read type name (null-terminated)
		const typeStart = cursor;
		while (cursor < bytes.length && bytes[cursor] !== 0) cursor++;
		const attrType = textDecode(bytes, typeStart, cursor);
		cursor++; // skip null

		// Read size (uint32)
		if (cursor + 4 > bytes.length) {
			throw new Error(
				"This EXR file could not be decoded. Header is truncated.",
			);
		}
		const attrSize = view.getUint32(cursor, true);
		cursor += 4;

		const attrDataStart = cursor;
		cursor += attrSize;

		if (attrName === "compression" && attrType === "compression") {
			compression = bytes[attrDataStart];
		} else if (attrName === "dataWindow" && attrType === "box2i") {
			dataWindow = [
				view.getInt32(attrDataStart, true),
				view.getInt32(attrDataStart + 4, true),
				view.getInt32(attrDataStart + 8, true),
				view.getInt32(attrDataStart + 12, true),
			];
		} else if (attrName === "channels" && attrType === "chlist") {
			parseChannelList(
				bytes,
				view,
				attrDataStart,
				attrDataStart + attrSize,
				channels,
			);
		}
	}

	if (dataWindow === null) {
		throw new Error(
			"This EXR file could not be decoded. Missing dataWindow attribute.",
		);
	}
	if (channels.length === 0) {
		throw new Error(
			"This EXR file could not be decoded. No channels found in header.",
		);
	}

	const width = dataWindow[2] - dataWindow[0] + 1;
	const height = dataWindow[3] - dataWindow[1] + 1;

	if (width <= 0 || height <= 0 || width > 32768 || height > 32768) {
		throw new Error(
			"This EXR file could not be decoded. Invalid image dimensions.",
		);
	}

	/* ---- 4. Validate compression ---- */
	if (compression !== 0 && compression !== 2 && compression !== 3) {
		const names: Record<number, string> = {
			1: "RLE",
			4: "PIZ",
			5: "PXR24",
			6: "B44",
			7: "B44A",
		};
		const name = names[compression] ?? `unknown (${compression})`;
		throw new Error(
			`This EXR file could not be decoded. ${name} compression is not supported — only uncompressed, ZIPS, and ZIP are handled.`,
		);
	}

	/* ---- 5. Sort channels alphabetically (EXR spec requires this) ---- */
	channels.sort((a, b) => a.name.localeCompare(b.name));

	// Compute bytes per pixel per channel
	const bytesPerPixelPerChannel = channels.map((ch) => {
		if (ch.pixelType === 0) return 4; // UINT
		if (ch.pixelType === 1) return 2; // HALF
		if (ch.pixelType === 2) return 4; // FLOAT
		return 2;
	});
	const scanlineBytesTotal = bytesPerPixelPerChannel.reduce(
		(sum, bpp) => sum + bpp * width,
		0,
	);

	/* ---- 6. Read offset table ---- */
	const scanlinesPerChunk = compression === 3 ? 16 : 1;
	const numChunks = Math.ceil(height / scanlinesPerChunk);

	if (cursor + numChunks * 8 > bytes.length) {
		throw new Error(
			"This EXR file could not be decoded. Offset table is truncated.",
		);
	}

	const offsets: number[] = [];
	for (let i = 0; i < numChunks; i++) {
		// Read as two 32-bit values to avoid BigInt requirement
		const lo = view.getUint32(cursor, true);
		const hi = view.getUint32(cursor + 4, true);
		offsets.push(lo + hi * 0x100000000);
		cursor += 8;
	}

	/* ---- 7. Read and decompress scanline blocks ---- */
	// Allocate float buffer for HDR data
	const floatPixels = new Float32Array(width * height * 4); // RGBA float

	// Map channel names to output indices (R=0, G=1, B=2, A=3)
	for (const ch of channels) {
		const upper = ch.name.toUpperCase();
		if (upper === "R" || upper === "RED") ch.outputIndex = 0;
		else if (upper === "G" || upper === "GREEN") ch.outputIndex = 1;
		else if (upper === "B" || upper === "BLUE") ch.outputIndex = 2;
		else if (upper === "A" || upper === "ALPHA") ch.outputIndex = 3;
		else ch.outputIndex = -1; // skip unknown channels
	}

	// Lazy-load fflate only for compressed files
	let decompress: (data: Uint8Array) => Uint8Array = (d) => d;
	if (compression === 2 || compression === 3) {
		const fflate = await import("fflate");
		decompress = fflate.inflateSync;
	}

	// Set default alpha to 1.0 (opaque) in case there's no A channel
	for (let i = 0; i < width * height; i++) {
		floatPixels[i * 4 + 3] = 1.0;
	}

	for (let chunk = 0; chunk < numChunks; chunk++) {
		const offset = offsets[chunk];

		if (offset + 8 > bytes.length) {
			throw new Error(
				"This EXR file could not be decoded. Scanline data is truncated.",
			);
		}

		const chunkY = view.getInt32(offset, true);
		const chunkDataSize = view.getInt32(offset + 4, true);

		if (offset + 8 + chunkDataSize > bytes.length) {
			throw new Error(
				"This EXR file could not be decoded. Scanline data is truncated.",
			);
		}

		const rawCompressed = bytes.subarray(
			offset + 8,
			offset + 8 + chunkDataSize,
		);

		const linesInChunk = Math.min(
			scanlinesPerChunk,
			height - (chunkY - dataWindow[1]),
		);
		const expectedBytes = scanlineBytesTotal * linesInChunk;

		let decompressed: Uint8Array;
		if (compression === 0) {
			decompressed = rawCompressed;
		} else {
			// ZIP/ZIPS: deflate-compressed data
			try {
				decompressed = decompress(rawCompressed);
			} catch {
				throw new Error(
					"This EXR file could not be decoded. Failed to decompress scanline data.",
				);
			}
			// Reconstruct from predictor encoding
			decompressed = reconstructPredictor(decompressed);
			// Interleave bytes back
			decompressed = interleaveBytes(decompressed);
		}

		if (decompressed.length < expectedBytes) {
			throw new Error(
				"This EXR file could not be decoded. Decompressed data is too short.",
			);
		}

		// Parse decompressed data: channels are stored interleaved per scanline
		// Within each scanline, all channels appear in alphabetical order
		const dView = new DataView(
			decompressed.buffer,
			decompressed.byteOffset,
			decompressed.byteLength,
		);
		let dCursor = 0;

		for (let line = 0; line < linesInChunk; line++) {
			const imageY = chunkY - dataWindow[1] + line;
			if (imageY < 0 || imageY >= height) {
				// Skip this line's data
				dCursor += bytesPerPixelPerChannel.reduce((s, b) => s + b * width, 0);
				continue;
			}

			for (let ci = 0; ci < channels.length; ci++) {
				const ch = channels[ci];

				for (let x = 0; x < width; x++) {
					let value: number;

					if (ch.pixelType === 1) {
						// HALF float (16-bit)
						const halfBits = dView.getUint16(dCursor, true);
						value = halfToFloat(halfBits);
						dCursor += 2;
					} else if (ch.pixelType === 2) {
						// FLOAT (32-bit)
						value = dView.getFloat32(dCursor, true);
						dCursor += 4;
					} else {
						// UINT (32-bit) — normalize to 0..1
						value = dView.getUint32(dCursor, true) / 4294967295;
						dCursor += 4;
					}

					if (ch.outputIndex >= 0) {
						const pixelIdx = (imageY * width + x) * 4 + ch.outputIndex;
						floatPixels[pixelIdx] = value;
					}
				}
			}
		}
	}

	/* ---- 8. Tone-map to 8-bit RGBA using Reinhard ---- */
	const rgba = new Uint8Array(width * height * 4);

	for (let i = 0; i < width * height; i++) {
		const r = Math.max(0, floatPixels[i * 4]);
		const g = Math.max(0, floatPixels[i * 4 + 1]);
		const b = Math.max(0, floatPixels[i * 4 + 2]);
		const a = floatPixels[i * 4 + 3];

		// Reinhard tone mapping: v / (1 + v)
		rgba[i * 4] = Math.min(255, Math.round((r / (1 + r)) * 255));
		rgba[i * 4 + 1] = Math.min(255, Math.round((g / (1 + g)) * 255));
		rgba[i * 4 + 2] = Math.min(255, Math.round((b / (1 + b)) * 255));
		// Alpha is linear — clamp to 0..255
		rgba[i * 4 + 3] = Math.min(255, Math.max(0, Math.round(a * 255)));
	}

	return { data: rgba, width, height };
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

interface ExrChannel {
	name: string;
	/** 0=UINT, 1=HALF, 2=FLOAT */
	pixelType: number;
	outputIndex: number;
}

function textDecode(bytes: Uint8Array, start: number, end: number): string {
	return new TextDecoder().decode(bytes.subarray(start, end));
}

/**
 * Parse an EXR channel list (chlist) attribute.
 * Each channel: name (null-terminated), pixelType (int32), pLinear (uint8),
 * reserved (3 bytes), xSampling (int32), ySampling (int32).
 * List ends with a null byte (empty name).
 */
function parseChannelList(
	bytes: Uint8Array,
	view: DataView,
	start: number,
	end: number,
	out: ExrChannel[],
): void {
	let pos = start;

	while (pos < end) {
		const nameStart = pos;
		while (pos < end && bytes[pos] !== 0) pos++;
		const name = textDecode(bytes, nameStart, pos);
		pos++; // skip null

		if (name === "") break; // end of channel list

		if (pos + 16 > end) break;

		const pixelType = view.getInt32(pos, true);
		pos += 4;
		// pLinear (1 byte) + reserved (3 bytes)
		pos += 4;
		// xSampling, ySampling (4 bytes each)
		pos += 8;

		out.push({ name, pixelType, outputIndex: -1 });
	}
}

/**
 * Convert IEEE 754 half-precision (16-bit) float to a JavaScript number.
 *
 * Layout: 1 sign | 5 exponent | 10 mantissa
 */
function halfToFloat(h: number): number {
	const sign = (h >>> 15) & 1;
	const exp = (h >>> 10) & 0x1f;
	const mant = h & 0x3ff;

	let value: number;
	if (exp === 0) {
		// Subnormal or zero
		value = (mant / 1024) * 2 ** -14;
	} else if (exp === 31) {
		// Inf or NaN
		value = mant === 0 ? Number.POSITIVE_INFINITY : Number.NaN;
	} else {
		value = (1 + mant / 1024) * 2 ** (exp - 15);
	}

	return sign ? -value : value;
}

/**
 * Reconstruct from the predictor encoding used by EXR ZIP compression.
 * Each byte stores the difference from the previous byte. We accumulate
 * to get back the original values.
 */
function reconstructPredictor(data: Uint8Array): Uint8Array {
	const out = new Uint8Array(data.length);
	if (data.length === 0) return out;
	out[0] = data[0];
	for (let i = 1; i < data.length; i++) {
		out[i] = (out[i - 1] + data[i]) & 0xff;
	}
	return out;
}

/**
 * Reverse the byte-interleaving used by EXR ZIP compression.
 * The compressor takes all byte-index-0 values first, then all byte-index-1
 * values, etc. We reverse that to get contiguous pixel data.
 */
function interleaveBytes(data: Uint8Array): Uint8Array {
	const len = data.length;
	const out = new Uint8Array(len);
	const half = Math.ceil(len / 2);
	let outIdx = 0;
	for (let i = 0; i < half; i++) {
		out[outIdx++] = data[i];
		if (i + half < len) {
			out[outIdx++] = data[i + half];
		}
	}
	return out;
}
