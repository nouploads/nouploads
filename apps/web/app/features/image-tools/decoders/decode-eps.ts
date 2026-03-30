import type { DecodedImage } from "./types";

/**
 * Magic bytes for the DOS EPS binary header format.
 * C5 D0 D3 C6 (little-endian: 0xC6D3D0C5 when read as uint32 BE,
 * but stored as 0xC5D0D3C6 LE).
 */
const DOS_EPS_MAGIC = 0xc5d0d3c6;

/**
 * Decode an EPS file by extracting its embedded preview image.
 *
 * EPS files can contain preview images in two wrapper formats:
 * 1. DOS EPS Binary Header — wraps PostScript with optional TIFF/WMF preview
 * 2. Text EPS (EPSI) — contains %%BeginPreview hex bitmap data
 *
 * Full PostScript rendering is not possible in a browser. This decoder
 * only extracts embedded previews.
 */
export async function decodeEps(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);

	if (bytes.length < 4) {
		throw new Error("This file is too small to be a valid EPS file.");
	}

	const view = new DataView(buffer);

	// Check for DOS EPS binary header
	const magic = view.getUint32(0, true);
	if (magic === DOS_EPS_MAGIC) {
		return decodeDosEps(buffer, view, signal);
	}

	// Check for text EPS (%!PS header)
	if (
		bytes[0] === 0x25 && // %
		bytes[1] === 0x21 && // !
		bytes[2] === 0x50 && // P
		bytes[3] === 0x53 // S
	) {
		return decodeTextEps(bytes, signal);
	}

	throw new Error(
		"This file does not appear to be a valid EPS file. Expected DOS EPS header or %!PS text header.",
	);
}

/**
 * Parse the 30-byte DOS EPS binary header and extract the TIFF preview.
 */
async function decodeDosEps(
	buffer: ArrayBuffer,
	view: DataView,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (buffer.byteLength < 30) {
		throw new Error(
			"This DOS EPS file is too short to contain a valid header.",
		);
	}

	// Bytes 12-15: WMF preview offset, 16-19: WMF preview length
	const wmfOffset = view.getUint32(12, true);
	const wmfLength = view.getUint32(16, true);

	// Bytes 20-23: TIFF preview offset, 24-27: TIFF preview length
	const tiffOffset = view.getUint32(20, true);
	const tiffLength = view.getUint32(24, true);

	if (tiffOffset > 0 && tiffLength > 0) {
		// Validate bounds
		if (tiffOffset + tiffLength > buffer.byteLength) {
			throw new Error(
				"This EPS file's TIFF preview data extends beyond the file boundary. The file may be truncated or corrupted.",
			);
		}

		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		// Extract TIFF bytes and decode via the existing TIFF decoder
		const tiffBytes = new Uint8Array(buffer, tiffOffset, tiffLength);
		const tiffBlob = new Blob([tiffBytes], { type: "image/tiff" });

		const { decodeTiff } = await import("./decode-tiff");

		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		return decodeTiff(tiffBlob, signal);
	}

	if (wmfOffset > 0 && wmfLength > 0) {
		throw new Error(
			"This EPS file contains a WMF preview, which is not currently supported. The file has no TIFF preview to extract. Try opening it in Inkscape or Adobe Illustrator.",
		);
	}

	// No TIFF or WMF preview — try the text PostScript section for EPSI preview
	const psOffset = view.getUint32(4, true);
	const psLength = view.getUint32(8, true);

	if (
		psOffset > 0 &&
		psLength > 0 &&
		psOffset + psLength <= buffer.byteLength
	) {
		const psBytes = new Uint8Array(buffer, psOffset, psLength);
		return decodeTextEps(psBytes, signal);
	}

	throw new Error(
		"This EPS file has no embedded preview. Full PostScript rendering requires desktop software like Inkscape or Adobe Illustrator.",
	);
}

/**
 * Parse a text EPS file looking for an EPSI %%BeginPreview section.
 * The preview is hex-encoded pixel data (1-bit monochrome or grayscale).
 */
function decodeTextEps(bytes: Uint8Array, signal?: AbortSignal): DecodedImage {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Convert to text to search for %%BeginPreview
	// Only scan the first 64KB to avoid excessive memory use on large files
	const searchLength = Math.min(bytes.length, 65536);
	const text = new TextDecoder("ascii").decode(bytes.subarray(0, searchLength));

	const beginMarker = "%%BeginPreview:";
	const beginIdx = text.indexOf(beginMarker);

	if (beginIdx === -1) {
		throw new Error(
			"This EPS file has no embedded preview. Full PostScript rendering requires desktop software like Inkscape or Adobe Illustrator.",
		);
	}

	// Parse the %%BeginPreview: width height depth lines
	const lineEnd = text.indexOf("\n", beginIdx);
	if (lineEnd === -1) {
		throw new Error("This EPS file has a malformed preview header.");
	}

	const headerLine = text
		.substring(beginIdx + beginMarker.length, lineEnd)
		.trim();
	const parts = headerLine.split(/\s+/);
	if (parts.length < 4) {
		throw new Error(
			"This EPS file has a malformed %%BeginPreview header. Expected: width height depth lines.",
		);
	}

	const width = Number.parseInt(parts[0], 10);
	const height = Number.parseInt(parts[1], 10);
	const depth = Number.parseInt(parts[2], 10);

	if (
		Number.isNaN(width) ||
		Number.isNaN(height) ||
		Number.isNaN(depth) ||
		width <= 0 ||
		height <= 0
	) {
		throw new Error("This EPS file has invalid preview dimensions.");
	}

	if (depth !== 1 && depth !== 8) {
		throw new Error(
			`This EPS file has an unsupported preview depth (${depth}). Only 1-bit and 8-bit previews are supported.`,
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Collect hex data from lines between %%BeginPreview and %%EndPreview
	const endMarker = "%%EndPreview";
	const endIdx = text.indexOf(endMarker, lineEnd);
	if (endIdx === -1) {
		throw new Error(
			"This EPS file has a preview section without a matching %%EndPreview.",
		);
	}

	const previewBlock = text.substring(lineEnd + 1, endIdx);
	const lines = previewBlock.split("\n");

	// Strip leading % from each line and concatenate hex chars
	let hexString = "";
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.length === 0) continue;
		// EPSI preview lines start with %
		const hex = trimmed.startsWith("%") ? trimmed.substring(1) : trimmed;
		hexString += hex.replace(/\s/g, "");
	}

	if (hexString.length === 0) {
		throw new Error("This EPS file has an empty preview section.");
	}

	// Convert hex string to bytes
	const hexBytes = hexToBytes(hexString);

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Convert to RGBA
	const rgba = new Uint8Array(width * height * 4);

	if (depth === 1) {
		// 1-bit monochrome: each bit is a pixel (1 = black, 0 = white)
		// Row-padded to byte boundaries
		const bytesPerRow = Math.ceil(width / 8);
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const byteIdx = y * bytesPerRow + Math.floor(x / 8);
				const bitIdx = 7 - (x % 8);
				const bit =
					byteIdx < hexBytes.length ? (hexBytes[byteIdx] >> bitIdx) & 1 : 0;
				// In EPSI, 1 = foreground (black), 0 = background (white)
				const color = bit ? 0 : 255;
				const dst = (y * width + x) * 4;
				rgba[dst] = color;
				rgba[dst + 1] = color;
				rgba[dst + 2] = color;
				rgba[dst + 3] = 255;
			}
		}
	} else {
		// 8-bit grayscale: each byte is a pixel value
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const srcIdx = y * width + x;
				const gray = srcIdx < hexBytes.length ? hexBytes[srcIdx] : 0;
				const dst = (y * width + x) * 4;
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
 * Convert a hex string to a Uint8Array.
 * Each pair of hex characters represents one byte.
 */
function hexToBytes(hex: string): Uint8Array {
	const len = Math.floor(hex.length / 2);
	const result = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		result[i] = Number.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
	}
	return result;
}
