import type { ImageData } from "../backend.js";

/**
 * Decode an SGI (Silicon Graphics Image) file to raw RGBA pixels.
 *
 * Custom parser — no external library. Handles:
 * - Verbatim (uncompressed) storage: channel planes stored sequentially
 * - RLE-compressed storage: offset/length tables + compressed scanlines
 * - 1-4 channels (grayscale, gray+alpha, RGB, RGBA)
 * - Bottom-to-top row order → flipped to top-to-bottom
 * - 1 byte per channel (bpc=1) only
 */
export async function decodeSgi(input: Uint8Array): Promise<ImageData> {
	const buffer = input.buffer.slice(
		input.byteOffset,
		input.byteOffset + input.byteLength,
	);
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	if (buffer.byteLength < 512) {
		throw new Error(
			"This SGI file could not be decoded. The header is too short.",
		);
	}

	// Magic number: 0x01DA (big-endian uint16 = 474)
	const magic = view.getUint16(0, false);
	if (magic !== 474) {
		throw new Error(
			"This SGI file could not be decoded. Invalid magic number.",
		);
	}

	const storage = view.getUint8(2); // 0 = verbatim, 1 = RLE
	const bpc = view.getUint8(3); // bytes per channel (must be 1)
	// const dimension = view.getUint16(4, false); // 1, 2, or 3
	const xsize = view.getUint16(6, false); // width
	const ysize = view.getUint16(8, false); // height
	const zsize = view.getUint16(10, false); // number of channels

	if (bpc !== 1) {
		throw new Error(
			`This SGI file uses ${bpc} bytes per channel. Only 1-byte channels are supported.`,
		);
	}

	if (xsize === 0 || ysize === 0) {
		throw new Error(
			"This SGI file could not be decoded. Image dimensions are zero.",
		);
	}

	if (xsize > 16384 || ysize > 16384) {
		throw new Error(
			"This SGI file could not be decoded. Image dimensions exceed 16384.",
		);
	}

	if (storage !== 0 && storage !== 1) {
		throw new Error(
			`This SGI file uses unsupported storage type (${storage}).`,
		);
	}

	// Decode channel planes
	const channelData = new Array<Uint8Array>(zsize);

	if (storage === 0) {
		// Verbatim: channels stored sequentially after 512-byte header
		// All rows of channel 0, then all rows of channel 1, etc.
		const planeSize = xsize * ysize;
		for (let z = 0; z < zsize; z++) {
			const offset = 512 + z * planeSize;
			if (offset + planeSize > bytes.length) {
				throw new Error(
					"This SGI file could not be decoded. Pixel data is truncated.",
				);
			}
			channelData[z] = bytes.slice(offset, offset + planeSize);
		}
	} else {
		// RLE: offset table and length table at byte 512
		const tableEntries = ysize * zsize;
		const offsetTableStart = 512;
		const lengthTableStart = 512 + tableEntries * 4;

		if (lengthTableStart + tableEntries * 4 > bytes.length) {
			throw new Error(
				"This SGI file could not be decoded. RLE tables are truncated.",
			);
		}

		// Read offset and length tables (uint32 big-endian)
		const offsets = new Uint32Array(tableEntries);
		const lengths = new Uint32Array(tableEntries);
		for (let i = 0; i < tableEntries; i++) {
			offsets[i] = view.getUint32(offsetTableStart + i * 4, false);
			lengths[i] = view.getUint32(lengthTableStart + i * 4, false);
		}

		// Decompress each scanline per channel
		for (let z = 0; z < zsize; z++) {
			channelData[z] = new Uint8Array(xsize * ysize);
			for (let y = 0; y < ysize; y++) {
				const tableIndex = y + z * ysize;
				const scanOffset = offsets[tableIndex];
				const scanLength = lengths[tableIndex];

				if (scanOffset + scanLength > bytes.length) {
					throw new Error(
						"This SGI file could not be decoded. RLE data is truncated.",
					);
				}

				const row = decompressRleScanline(bytes, scanOffset, scanLength, xsize);
				channelData[z].set(row, y * xsize);
			}
		}
	}

	// Interleave channels to RGBA (bottom-to-top → top-to-bottom)
	const rgba = new Uint8Array(xsize * ysize * 4);

	for (let y = 0; y < ysize; y++) {
		// SGI stores bottom-to-top, so flip
		const srcY = ysize - 1 - y;
		for (let x = 0; x < xsize; x++) {
			const srcIdx = srcY * xsize + x;
			const dstIdx = (y * xsize + x) * 4;

			if (zsize >= 3) {
				rgba[dstIdx] = channelData[0][srcIdx]; // R
				rgba[dstIdx + 1] = channelData[1][srcIdx]; // G
				rgba[dstIdx + 2] = channelData[2][srcIdx]; // B
				rgba[dstIdx + 3] = zsize >= 4 ? channelData[3][srcIdx] : 255;
			} else if (zsize === 2) {
				// Gray + Alpha
				const gray = channelData[0][srcIdx];
				rgba[dstIdx] = gray;
				rgba[dstIdx + 1] = gray;
				rgba[dstIdx + 2] = gray;
				rgba[dstIdx + 3] = channelData[1][srcIdx];
			} else {
				// Grayscale
				const gray = channelData[0][srcIdx];
				rgba[dstIdx] = gray;
				rgba[dstIdx + 1] = gray;
				rgba[dstIdx + 2] = gray;
				rgba[dstIdx + 3] = 255;
			}
		}
	}

	return { data: rgba, width: xsize, height: ysize };
}

/**
 * Decompress a single RLE-compressed SGI scanline.
 *
 * SGI RLE format: each byte is a control byte.
 * - If count (low 7 bits) is 0, end of scanline.
 * - If high bit is set (0x80): copy next `count` literal bytes.
 * - If high bit is clear: repeat the next byte `count` times.
 */
function decompressRleScanline(
	src: Uint8Array,
	offset: number,
	_length: number,
	xsize: number,
): Uint8Array {
	const row = new Uint8Array(xsize);
	let pos = offset;
	let outPos = 0;

	while (outPos < xsize && pos < src.length) {
		const pixel = src[pos++];
		const count = pixel & 0x7f;
		if (count === 0) break; // end of scanline

		if (pixel & 0x80) {
			// Copy `count` literal bytes
			for (let i = 0; i < count && outPos < xsize; i++) {
				row[outPos++] = src[pos++];
			}
		} else {
			// Repeat the next byte `count` times
			const value = src[pos++];
			for (let i = 0; i < count && outPos < xsize; i++) {
				row[outPos++] = value;
			}
		}
	}

	return row;
}
