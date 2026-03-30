import { inferMime } from "../processors/convert-image";

export interface AnimationInfo {
	isAnimated: boolean;
	frameCount: number;
	/** Human-readable format label (e.g. "GIF", "APNG", "WebP") */
	format: string;
}

/**
 * Detect whether an image file contains animation.
 *
 * Reads only the minimal header bytes needed for detection (<5ms).
 * Returns `null` for formats that never support animation (JPEG, TIFF, etc.).
 */
export async function detectAnimation(
	file: File,
): Promise<AnimationInfo | null> {
	const mime = inferMime(file);

	switch (mime) {
		case "image/gif":
			return detectGifAnimation(file);
		case "image/png":
			return detectApngAnimation(file);
		case "image/webp":
			return detectWebpAnimation(file);
		case "image/avif":
			return detectAvifAnimation(file);
		default:
			return null;
	}
}

// ─── GIF ───────────────────────────────────────────────────

/**
 * Skip past a sequence of GIF data sub-blocks.
 * Each sub-block starts with a byte indicating its length (1-255).
 * A zero-length byte terminates the sequence.
 * Returns the offset after the terminating 0x00 byte.
 */
function skipGifSubBlocks(bytes: Uint8Array, offset: number): number {
	let pos = offset;
	while (pos < bytes.length) {
		const blockSize = bytes[pos];
		pos++; // consume the size byte
		if (blockSize === 0) break; // block terminator
		pos += blockSize;
	}
	return pos;
}

/**
 * Walk the GIF block structure to count image descriptors (0x2C).
 * Unlike a naive byte scan, this properly skips over compressed image data
 * and extension blocks, so 0x2C bytes inside pixel data are not miscounted.
 */
async function detectGifAnimation(file: File): Promise<AnimationInfo> {
	const buffer = await file.arrayBuffer();
	const bytes = new Uint8Array(buffer);

	if (bytes.length < 13) {
		return { isAnimated: false, frameCount: 0, format: "GIF" };
	}

	// Skip header (6 bytes) + Logical Screen Descriptor (7 bytes)
	let offset = 13;

	// Skip Global Color Table if present
	const packed = bytes[10];
	const hasGct = (packed & 0x80) !== 0;
	if (hasGct) {
		const gctSize = 3 * (1 << ((packed & 0x07) + 1));
		offset += gctSize;
	}

	let frameCount = 0;

	while (offset < bytes.length) {
		const sentinel = bytes[offset];

		if (sentinel === 0x2c) {
			// Image Descriptor
			frameCount++;
			offset++; // past sentinel
			// Image descriptor is 9 bytes (sentinel already consumed, so 8 more)
			if (offset + 8 > bytes.length) break;
			// Check for Local Color Table
			const imgPacked = bytes[offset + 7];
			offset += 8;
			const hasLct = (imgPacked & 0x80) !== 0;
			if (hasLct) {
				const lctSize = 3 * (1 << ((imgPacked & 0x07) + 1));
				offset += lctSize;
			}
			// Skip LZW minimum code size byte
			offset++;
			// Skip image data sub-blocks
			offset = skipGifSubBlocks(bytes, offset);
		} else if (sentinel === 0x21) {
			// Extension block
			offset += 2; // skip 0x21 + extension label
			offset = skipGifSubBlocks(bytes, offset);
		} else if (sentinel === 0x3b) {
			// Trailer — end of GIF
			break;
		} else {
			// Unknown byte; advance to avoid infinite loop
			offset++;
		}
	}

	return {
		isAnimated: frameCount > 1,
		frameCount,
		format: "GIF",
	};
}

// ─── APNG ──────────────────────────────────────────────────

/**
 * Scan PNG chunks for the `acTL` (animation control) chunk.
 * If present, read `num_frames` from its data (uint32 at offset 0).
 */
async function detectApngAnimation(file: File): Promise<AnimationInfo> {
	const buffer = await file.arrayBuffer();
	const view = new DataView(buffer);

	// PNG signature is 8 bytes, then chunks start
	let offset = 8;

	while (offset + 8 <= buffer.byteLength) {
		const chunkLength = view.getUint32(offset, false);
		const chunkType =
			String.fromCharCode(view.getUint8(offset + 4)) +
			String.fromCharCode(view.getUint8(offset + 5)) +
			String.fromCharCode(view.getUint8(offset + 6)) +
			String.fromCharCode(view.getUint8(offset + 7));

		if (chunkType === "acTL") {
			// acTL chunk data: uint32 num_frames, uint32 num_plays
			const numFrames =
				offset + 8 + 4 <= buffer.byteLength
					? view.getUint32(offset + 8, false)
					: 0;
			return {
				isAnimated: numFrames > 1,
				frameCount: numFrames,
				format: "APNG",
			};
		}

		// Move past: 4 (length) + 4 (type) + chunkLength (data) + 4 (CRC)
		offset += 12 + chunkLength;
	}

	return { isAnimated: false, frameCount: 1, format: "PNG" };
}

// ─── WebP ──────────────────────────────────────────────────

/**
 * Parse RIFF/WebP structure.
 * Find VP8X chunk and check animation flag (bit 1 of byte 0 of VP8X payload).
 * Count ANMF chunks for frame count.
 */
async function detectWebpAnimation(file: File): Promise<AnimationInfo> {
	const buffer = await file.arrayBuffer();
	const view = new DataView(buffer);

	// Minimum RIFF header: "RIFF" (4) + size (4) + "WEBP" (4) = 12
	if (buffer.byteLength < 12) {
		return { isAnimated: false, frameCount: 1, format: "WebP" };
	}

	let isAnimated = false;
	let frameCount = 0;

	// Scan chunks after "RIFF" + size + "WEBP" header
	let offset = 12;

	while (offset + 8 <= buffer.byteLength) {
		const chunkFourCC =
			String.fromCharCode(view.getUint8(offset)) +
			String.fromCharCode(view.getUint8(offset + 1)) +
			String.fromCharCode(view.getUint8(offset + 2)) +
			String.fromCharCode(view.getUint8(offset + 3));
		const chunkSize = view.getUint32(offset + 4, true); // little-endian

		if (chunkFourCC === "VP8X" && offset + 8 < buffer.byteLength) {
			// VP8X payload byte 0: flags byte
			// Bit 1 (0x02) = animation flag
			const flags = view.getUint8(offset + 8);
			isAnimated = (flags & 0x02) !== 0;
		}

		if (chunkFourCC === "ANMF") {
			frameCount++;
		}

		// Chunks are padded to even size
		const paddedSize = chunkSize + (chunkSize % 2);
		offset += 8 + paddedSize;
	}

	if (isAnimated && frameCount === 0) {
		// VP8X says animated but we couldn't count ANMF chunks
		frameCount = 0;
	}

	if (!isAnimated) {
		frameCount = 1;
	}

	return { isAnimated, frameCount, format: "WebP" };
}

// ─── AVIF ──────────────────────────────────────────────────

/**
 * Parse ISOBMFF ftyp box and check compatible brands for "avis" (animated AVIF).
 * Frame count is reported as 0 (exact count requires deep ISOBMFF parsing).
 */
async function detectAvifAnimation(file: File): Promise<AnimationInfo> {
	// Read only the first 512 bytes — ftyp box is always at the start and small
	const slice = file.slice(0, Math.min(file.size, 512));
	const buffer = await slice.arrayBuffer();
	const view = new DataView(buffer);

	if (buffer.byteLength < 8) {
		return { isAnimated: false, frameCount: 1, format: "AVIF" };
	}

	// ftyp box: uint32 size, "ftyp" fourcc, then brand data
	const boxSize = view.getUint32(0, false);
	const boxType =
		String.fromCharCode(view.getUint8(4)) +
		String.fromCharCode(view.getUint8(5)) +
		String.fromCharCode(view.getUint8(6)) +
		String.fromCharCode(view.getUint8(7));

	if (boxType !== "ftyp") {
		return { isAnimated: false, frameCount: 1, format: "AVIF" };
	}

	// ftyp layout: major_brand (4) + minor_version (4) + compatible_brands (4 each)
	// compatible brands start at offset 16
	const ftypEnd = Math.min(boxSize, buffer.byteLength);

	for (let i = 16; i + 4 <= ftypEnd; i += 4) {
		const brand =
			String.fromCharCode(view.getUint8(i)) +
			String.fromCharCode(view.getUint8(i + 1)) +
			String.fromCharCode(view.getUint8(i + 2)) +
			String.fromCharCode(view.getUint8(i + 3));

		if (brand === "avis") {
			return { isAnimated: true, frameCount: 0, format: "AVIF" };
		}
	}

	return { isAnimated: false, frameCount: 1, format: "AVIF" };
}
