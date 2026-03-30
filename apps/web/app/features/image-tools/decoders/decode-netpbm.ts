import type { DecodedImage } from "./types";

/**
 * Decode a Netpbm family file (PBM/PGM/PPM/PNM/PAM/PFM) to raw RGBA pixels.
 *
 * Custom parser -- no external dependencies. Handles:
 * - P1: ASCII PBM (1-bit, 1=black 0=white)
 * - P2: ASCII PGM (grayscale)
 * - P3: ASCII PPM (RGB)
 * - P4: Binary PBM (packed 8 pixels/byte, MSB first)
 * - P5: Binary PGM (grayscale)
 * - P6: Binary PPM (RGB)
 * - P7: PAM (arbitrary channels via keyword headers)
 * - Pf: PFM grayscale float (32-bit IEEE, bottom-to-top)
 * - PF: PFM RGB float (32-bit IEEE, bottom-to-top)
 */
export async function decodeNetpbm(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);

	if (bytes.length < 3) {
		throw new Error(
			"This Netpbm file could not be decoded. The file is too short.",
		);
	}

	// Read magic number (2 bytes)
	const magic = String.fromCharCode(bytes[0], bytes[1]);

	switch (magic) {
		case "P1":
			return decodeP1(bytes);
		case "P2":
			return decodeP2(bytes);
		case "P3":
			return decodeP3(bytes);
		case "P4":
			return decodeP4(bytes);
		case "P5":
			return decodeP5(bytes);
		case "P6":
			return decodeP6(bytes);
		case "P7":
			return decodeP7(bytes);
		case "Pf":
			return decodePfm(bytes, 1);
		case "PF":
			return decodePfm(bytes, 3);
		default:
			throw new Error(
				`This Netpbm file could not be decoded. Unrecognized magic number "${magic}".`,
			);
	}
}

/* ------------------------------------------------------------------ */
/*  Header parsing helpers                                            */
/* ------------------------------------------------------------------ */

/**
 * Skip whitespace and comments (lines starting with #).
 * Returns the new cursor position.
 */
function skipWhitespaceAndComments(bytes: Uint8Array, pos: number): number {
	let cursor = pos;
	while (cursor < bytes.length) {
		const ch = bytes[cursor];
		// Skip whitespace (space, tab, CR, LF)
		if (ch === 0x20 || ch === 0x09 || ch === 0x0d || ch === 0x0a) {
			cursor++;
			continue;
		}
		// Skip comment lines
		if (ch === 0x23) {
			// '#'
			while (cursor < bytes.length && bytes[cursor] !== 0x0a) cursor++;
			if (cursor < bytes.length) cursor++; // skip the \n
			continue;
		}
		break;
	}
	return cursor;
}

/**
 * Read the next whitespace-separated integer token, skipping comments.
 */
function readInt(
	bytes: Uint8Array,
	pos: number,
): { value: number; cursor: number } {
	let cursor = skipWhitespaceAndComments(bytes, pos);
	let numStr = "";
	while (cursor < bytes.length) {
		const ch = bytes[cursor];
		if (ch >= 0x30 && ch <= 0x39) {
			// '0'-'9'
			numStr += String.fromCharCode(ch);
			cursor++;
		} else {
			break;
		}
	}
	if (numStr === "") {
		throw new Error(
			"This Netpbm file could not be decoded. Expected an integer in the header.",
		);
	}
	return { value: Number.parseInt(numStr, 10), cursor };
}

/**
 * Parse standard header: width, height, and optionally maxval.
 * Starts after the magic bytes.
 */
function parseStandardHeader(
	bytes: Uint8Array,
	startPos: number,
	hasMaxval: boolean,
): { width: number; height: number; maxval: number; dataStart: number } {
	const w = readInt(bytes, startPos);
	const h = readInt(bytes, w.cursor);
	let maxval = 1;
	let dataStart = h.cursor;

	if (hasMaxval) {
		const m = readInt(bytes, h.cursor);
		maxval = m.value;
		dataStart = m.cursor;
	}

	// After the last header token, exactly one whitespace character
	// separates header from data in binary formats
	if (dataStart < bytes.length) {
		const ch = bytes[dataStart];
		if (ch === 0x20 || ch === 0x09 || ch === 0x0d || ch === 0x0a) {
			dataStart++;
		}
	}

	if (w.value <= 0 || h.value <= 0 || w.value > 32768 || h.value > 32768) {
		throw new Error(
			"This Netpbm file could not be decoded. Invalid image dimensions.",
		);
	}

	if (hasMaxval && (maxval <= 0 || maxval > 65535)) {
		throw new Error("This Netpbm file could not be decoded. Invalid maxval.");
	}

	return { width: w.value, height: h.value, maxval, dataStart };
}

/**
 * Read all whitespace-separated integers from ASCII pixel data.
 */
function readAsciiValues(bytes: Uint8Array, startPos: number): number[] {
	const values: number[] = [];
	let cursor = startPos;
	while (cursor < bytes.length) {
		cursor = skipWhitespaceAndComments(bytes, cursor);
		if (cursor >= bytes.length) break;
		let numStr = "";
		while (cursor < bytes.length) {
			const ch = bytes[cursor];
			if (ch >= 0x30 && ch <= 0x39) {
				numStr += String.fromCharCode(ch);
				cursor++;
			} else {
				break;
			}
		}
		if (numStr !== "") {
			values.push(Number.parseInt(numStr, 10));
		}
	}
	return values;
}

/**
 * Scale a pixel value from [0, maxval] to [0, 255].
 */
function scaleToU8(value: number, maxval: number): number {
	if (maxval === 255) return value;
	return Math.round((value / maxval) * 255);
}

/* ------------------------------------------------------------------ */
/*  Format decoders                                                   */
/* ------------------------------------------------------------------ */

/** P1: ASCII PBM (1-bit, 1=black 0=white) */
function decodeP1(bytes: Uint8Array): DecodedImage {
	const header = parseStandardHeader(bytes, 2, false);
	const values = readAsciiValues(bytes, header.dataStart);
	const { width, height } = header;
	const pixelCount = width * height;
	const rgba = new Uint8Array(pixelCount * 4);

	for (let i = 0; i < pixelCount; i++) {
		const bit = i < values.length ? values[i] : 0;
		// PBM: 1 = black, 0 = white
		const gray = bit === 1 ? 0 : 255;
		rgba[i * 4] = gray;
		rgba[i * 4 + 1] = gray;
		rgba[i * 4 + 2] = gray;
		rgba[i * 4 + 3] = 255;
	}

	return { data: rgba, width, height };
}

/** P2: ASCII PGM (grayscale) */
function decodeP2(bytes: Uint8Array): DecodedImage {
	const header = parseStandardHeader(bytes, 2, true);
	const values = readAsciiValues(bytes, header.dataStart);
	const { width, height, maxval } = header;
	const pixelCount = width * height;
	const rgba = new Uint8Array(pixelCount * 4);

	for (let i = 0; i < pixelCount; i++) {
		const gray = scaleToU8(i < values.length ? values[i] : 0, maxval);
		rgba[i * 4] = gray;
		rgba[i * 4 + 1] = gray;
		rgba[i * 4 + 2] = gray;
		rgba[i * 4 + 3] = 255;
	}

	return { data: rgba, width, height };
}

/** P3: ASCII PPM (RGB) */
function decodeP3(bytes: Uint8Array): DecodedImage {
	const header = parseStandardHeader(bytes, 2, true);
	const values = readAsciiValues(bytes, header.dataStart);
	const { width, height, maxval } = header;
	const pixelCount = width * height;
	const rgba = new Uint8Array(pixelCount * 4);

	for (let i = 0; i < pixelCount; i++) {
		const base = i * 3;
		rgba[i * 4] = scaleToU8(base < values.length ? values[base] : 0, maxval);
		rgba[i * 4 + 1] = scaleToU8(
			base + 1 < values.length ? values[base + 1] : 0,
			maxval,
		);
		rgba[i * 4 + 2] = scaleToU8(
			base + 2 < values.length ? values[base + 2] : 0,
			maxval,
		);
		rgba[i * 4 + 3] = 255;
	}

	return { data: rgba, width, height };
}

/** P4: Binary PBM (packed bits, MSB first, rows padded to byte boundary) */
function decodeP4(bytes: Uint8Array): DecodedImage {
	const header = parseStandardHeader(bytes, 2, false);
	const { width, height, dataStart } = header;
	const pixelCount = width * height;
	const rgba = new Uint8Array(pixelCount * 4);
	const bytesPerRow = Math.ceil(width / 8);
	let cursor = dataStart;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const byteIndex = cursor + Math.floor(x / 8);
			const bitIndex = 7 - (x % 8);
			if (byteIndex >= bytes.length) break;
			const bit = (bytes[byteIndex] >> bitIndex) & 1;
			// PBM binary: 1 = black, 0 = white
			const gray = bit === 1 ? 0 : 255;
			const idx = (y * width + x) * 4;
			rgba[idx] = gray;
			rgba[idx + 1] = gray;
			rgba[idx + 2] = gray;
			rgba[idx + 3] = 255;
		}
		cursor += bytesPerRow;
	}

	return { data: rgba, width, height };
}

/** P5: Binary PGM (grayscale, 1 or 2 bytes per sample) */
function decodeP5(bytes: Uint8Array): DecodedImage {
	const header = parseStandardHeader(bytes, 2, true);
	const { width, height, maxval, dataStart } = header;
	const pixelCount = width * height;
	const rgba = new Uint8Array(pixelCount * 4);
	const bpc = maxval < 256 ? 1 : 2;
	let cursor = dataStart;

	for (let i = 0; i < pixelCount; i++) {
		let value: number;
		if (bpc === 2) {
			if (cursor + 1 >= bytes.length) break;
			value = (bytes[cursor] << 8) | bytes[cursor + 1]; // big-endian
			cursor += 2;
		} else {
			if (cursor >= bytes.length) break;
			value = bytes[cursor];
			cursor += 1;
		}
		const gray = scaleToU8(value, maxval);
		rgba[i * 4] = gray;
		rgba[i * 4 + 1] = gray;
		rgba[i * 4 + 2] = gray;
		rgba[i * 4 + 3] = 255;
	}

	return { data: rgba, width, height };
}

/** P6: Binary PPM (RGB, 1 or 2 bytes per channel) */
function decodeP6(bytes: Uint8Array): DecodedImage {
	const header = parseStandardHeader(bytes, 2, true);
	const { width, height, maxval, dataStart } = header;
	const pixelCount = width * height;
	const rgba = new Uint8Array(pixelCount * 4);
	const bpc = maxval < 256 ? 1 : 2;
	let cursor = dataStart;

	for (let i = 0; i < pixelCount; i++) {
		for (let ch = 0; ch < 3; ch++) {
			let value: number;
			if (bpc === 2) {
				if (cursor + 1 >= bytes.length) break;
				value = (bytes[cursor] << 8) | bytes[cursor + 1];
				cursor += 2;
			} else {
				if (cursor >= bytes.length) break;
				value = bytes[cursor];
				cursor += 1;
			}
			rgba[i * 4 + ch] = scaleToU8(value, maxval);
		}
		rgba[i * 4 + 3] = 255;
	}

	return { data: rgba, width, height };
}

/** P7: PAM (Portable Arbitrary Map) with keyword headers */
function decodeP7(bytes: Uint8Array): DecodedImage {
	let cursor = 2; // skip "P7"

	let width = 0;
	let height = 0;
	let depth = 0;
	let maxval = 0;
	let _tupltype = "";

	// Read keyword header lines until ENDHDR
	while (cursor < bytes.length) {
		// Skip to start of line (skip single whitespace after magic on first pass)
		if (
			bytes[cursor] === 0x0a ||
			bytes[cursor] === 0x0d ||
			bytes[cursor] === 0x20 ||
			bytes[cursor] === 0x09
		) {
			cursor++;
			continue;
		}

		// Read line
		const lineStart = cursor;
		while (cursor < bytes.length && bytes[cursor] !== 0x0a) cursor++;
		const line = new TextDecoder().decode(bytes.subarray(lineStart, cursor));
		if (cursor < bytes.length) cursor++; // skip \n

		const trimmed = line.trim();
		if (trimmed === "" || trimmed.startsWith("#")) continue;
		if (trimmed === "ENDHDR") break;

		const spaceIdx = trimmed.indexOf(" ");
		if (spaceIdx === -1) continue;
		const keyword = trimmed.substring(0, spaceIdx);
		const val = trimmed.substring(spaceIdx + 1).trim();

		switch (keyword) {
			case "WIDTH":
				width = Number.parseInt(val, 10);
				break;
			case "HEIGHT":
				height = Number.parseInt(val, 10);
				break;
			case "DEPTH":
				depth = Number.parseInt(val, 10);
				break;
			case "MAXVAL":
				maxval = Number.parseInt(val, 10);
				break;
			case "TUPLTYPE":
				_tupltype = val;
				break;
		}
	}

	if (width <= 0 || height <= 0 || width > 32768 || height > 32768) {
		throw new Error(
			"This PAM file could not be decoded. Invalid image dimensions.",
		);
	}
	if (depth <= 0 || depth > 4) {
		throw new Error(
			"This PAM file could not be decoded. Unsupported DEPTH value.",
		);
	}
	if (maxval <= 0 || maxval > 65535) {
		throw new Error("This PAM file could not be decoded. Invalid MAXVAL.");
	}

	const pixelCount = width * height;
	const bpc = maxval < 256 ? 1 : 2;
	const rgba = new Uint8Array(pixelCount * 4);

	for (let i = 0; i < pixelCount; i++) {
		const channels: number[] = [];
		for (let ch = 0; ch < depth; ch++) {
			let value: number;
			if (bpc === 2) {
				if (cursor + 1 >= bytes.length) break;
				value = (bytes[cursor] << 8) | bytes[cursor + 1];
				cursor += 2;
			} else {
				if (cursor >= bytes.length) break;
				value = bytes[cursor];
				cursor += 1;
			}
			channels.push(scaleToU8(value, maxval));
		}

		if (depth === 1) {
			// Grayscale
			rgba[i * 4] = channels[0] ?? 0;
			rgba[i * 4 + 1] = channels[0] ?? 0;
			rgba[i * 4 + 2] = channels[0] ?? 0;
			rgba[i * 4 + 3] = 255;
		} else if (depth === 2) {
			// Grayscale + alpha
			rgba[i * 4] = channels[0] ?? 0;
			rgba[i * 4 + 1] = channels[0] ?? 0;
			rgba[i * 4 + 2] = channels[0] ?? 0;
			rgba[i * 4 + 3] = channels[1] ?? 255;
		} else if (depth === 3) {
			// RGB
			rgba[i * 4] = channels[0] ?? 0;
			rgba[i * 4 + 1] = channels[1] ?? 0;
			rgba[i * 4 + 2] = channels[2] ?? 0;
			rgba[i * 4 + 3] = 255;
		} else if (depth === 4) {
			// RGBA
			rgba[i * 4] = channels[0] ?? 0;
			rgba[i * 4 + 1] = channels[1] ?? 0;
			rgba[i * 4 + 2] = channels[2] ?? 0;
			rgba[i * 4 + 3] = channels[3] ?? 255;
		}
	}

	return { data: rgba, width, height };
}

/**
 * PFM: Portable FloatMap (Pf = grayscale, PF = RGB).
 * 32-bit IEEE float per channel, bottom-to-top row order.
 * Scale line: negative = little-endian floats.
 * Tone-maps with Reinhard operator.
 */
function decodePfm(bytes: Uint8Array, channels: 1 | 3): DecodedImage {
	let cursor = 2; // skip magic

	// Read width and height (text line)
	cursor = skipWhitespaceAndComments(bytes, cursor);
	const wh = readPfmLine(bytes, cursor);
	cursor = wh.cursor;
	const parts = wh.line.trim().split(/\s+/);
	if (parts.length < 2) {
		throw new Error(
			"This PFM file could not be decoded. Invalid dimension line.",
		);
	}
	const width = Number.parseInt(parts[0], 10);
	const height = Number.parseInt(parts[1], 10);

	if (width <= 0 || height <= 0 || width > 32768 || height > 32768) {
		throw new Error(
			"This PFM file could not be decoded. Invalid image dimensions.",
		);
	}

	// Read scale line
	const scaleLine = readPfmLine(bytes, cursor);
	cursor = scaleLine.cursor;
	const scale = Number.parseFloat(scaleLine.line.trim());
	if (Number.isNaN(scale) || scale === 0) {
		throw new Error("This PFM file could not be decoded. Invalid scale value.");
	}
	const littleEndian = scale < 0;

	// Read float pixel data
	const pixelCount = width * height;
	const floatsPerPixel = channels;
	const totalFloats = pixelCount * floatsPerPixel;
	const floatBytes = totalFloats * 4;

	if (cursor + floatBytes > bytes.length) {
		throw new Error(
			"This PFM file could not be decoded. Pixel data is truncated.",
		);
	}

	const dataView = new DataView(
		bytes.buffer,
		bytes.byteOffset + cursor,
		floatBytes,
	);

	// PFM stores rows bottom-to-top, so we read in reverse row order
	const rgba = new Uint8Array(pixelCount * 4);

	for (let y = 0; y < height; y++) {
		// Source row: y=0 is the bottom row in PFM
		const srcRow = y;
		// Destination row: flip so y=0 maps to the last row
		const dstRow = height - 1 - srcRow;

		for (let x = 0; x < width; x++) {
			const srcIdx = (srcRow * width + x) * floatsPerPixel * 4;
			const dstIdx = (dstRow * width + x) * 4;

			if (channels === 3) {
				const r = dataView.getFloat32(srcIdx, littleEndian);
				const g = dataView.getFloat32(srcIdx + 4, littleEndian);
				const b = dataView.getFloat32(srcIdx + 8, littleEndian);

				// Reinhard tone mapping
				rgba[dstIdx] = floatToU8(r);
				rgba[dstIdx + 1] = floatToU8(g);
				rgba[dstIdx + 2] = floatToU8(b);
			} else {
				const gray = dataView.getFloat32(srcIdx, littleEndian);
				const mapped = floatToU8(gray);
				rgba[dstIdx] = mapped;
				rgba[dstIdx + 1] = mapped;
				rgba[dstIdx + 2] = mapped;
			}
			rgba[dstIdx + 3] = 255;
		}
	}

	return { data: rgba, width, height };
}

/** Read a text line from PFM header (terminated by \n). */
function readPfmLine(
	bytes: Uint8Array,
	pos: number,
): { line: string; cursor: number } {
	let cursor = pos;
	while (cursor < bytes.length && bytes[cursor] !== 0x0a) cursor++;
	const line = new TextDecoder().decode(bytes.subarray(pos, cursor));
	if (cursor < bytes.length) cursor++; // skip \n
	return { line, cursor };
}

/** Reinhard tone-map a float HDR value to 0-255. */
function floatToU8(v: number): number {
	const clamped = Math.max(0, v);
	const mapped = clamped / (1 + clamped);
	return Math.min(255, Math.round(mapped * 255));
}
