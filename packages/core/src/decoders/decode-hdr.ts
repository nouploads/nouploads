import type { ImageData } from "../backend.js";

/**
 * Decode a Radiance HDR (.hdr) file to raw RGBA pixels.
 *
 * Custom RGBE parser — no external dependencies.
 * Handles both new-style RLE and uncompressed scanlines.
 * Tone-maps HDR floats to 8-bit sRGB using the Reinhard operator.
 */
export async function decodeHdr(input: Uint8Array): Promise<ImageData> {
	const bytes = input;

	/* ---- 1. Parse header ---- */
	let cursor = 0;
	const headerLines: string[] = [];

	// Read text lines until we hit an empty line
	while (cursor < bytes.length) {
		const lineStart = cursor;
		while (cursor < bytes.length && bytes[cursor] !== 0x0a) cursor++;
		const line = new TextDecoder().decode(bytes.subarray(lineStart, cursor));
		cursor++; // skip \n
		if (line === "" || line === "\r") break;
		headerLines.push(line.replace(/\r$/, ""));
	}

	// Validate magic
	const magic = headerLines[0];
	if (
		!magic ||
		(!magic.startsWith("#?RADIANCE") && !magic.startsWith("#?RGBE"))
	) {
		throw new Error(
			"This HDR file could not be decoded. The header does not contain a valid Radiance signature.",
		);
	}

	// Validate FORMAT
	const formatLine = headerLines.find((l) => l.startsWith("FORMAT="));
	if (formatLine) {
		const fmt = formatLine.slice(7);
		if (fmt !== "32-bit_rle_rgbe" && fmt !== "32-bit_rle_xyze") {
			throw new Error(
				"This HDR file could not be decoded. Unsupported pixel format.",
			);
		}
	}

	/* ---- 2. Parse resolution string ---- */
	// Resolution line is the first line after the empty separator
	const resStart = cursor;
	while (cursor < bytes.length && bytes[cursor] !== 0x0a) cursor++;
	const resLine = new TextDecoder().decode(bytes.subarray(resStart, cursor));
	cursor++; // skip \n

	const resMatch = resLine.match(/^-Y\s+(\d+)\s+\+X\s+(\d+)/);
	if (!resMatch) {
		throw new Error(
			"This HDR file could not be decoded. Invalid or unsupported resolution string.",
		);
	}

	const height = Number.parseInt(resMatch[1], 10);
	const width = Number.parseInt(resMatch[2], 10);

	if (width <= 0 || height <= 0 || width > 32768 || height > 32768) {
		throw new Error(
			"This HDR file could not be decoded. Invalid image dimensions.",
		);
	}

	/* ---- 3. Read pixel data ---- */
	const rgbe = new Uint8Array(width * height * 4);

	for (let y = 0; y < height; y++) {
		if (cursor + 4 > bytes.length) {
			throw new Error(
				"This HDR file could not be decoded. Pixel data is truncated.",
			);
		}

		// Detect new-style RLE: first 2 bytes are [2, 2], next 2 are width big-endian
		if (
			bytes[cursor] === 2 &&
			bytes[cursor + 1] === 2 &&
			((bytes[cursor + 2] << 8) | bytes[cursor + 3]) === width &&
			width >= 8 &&
			width <= 0x7fff
		) {
			// New-style RLE scanline
			cursor += 4;
			const scanline = new Uint8Array(width * 4);

			for (let ch = 0; ch < 4; ch++) {
				let ptr = 0;
				while (ptr < width) {
					if (cursor >= bytes.length) {
						throw new Error(
							"This HDR file could not be decoded. Pixel data is truncated.",
						);
					}
					const code = bytes[cursor++];
					if (code > 128) {
						// Run: (code - 128) copies of the next byte
						const count = code - 128;
						if (cursor >= bytes.length) {
							throw new Error(
								"This HDR file could not be decoded. Pixel data is truncated.",
							);
						}
						const val = bytes[cursor++];
						for (let i = 0; i < count && ptr < width; i++) {
							scanline[ptr * 4 + ch] = val;
							ptr++;
						}
					} else {
						// Literal: code bytes verbatim
						const count = code;
						for (let i = 0; i < count && ptr < width; i++) {
							if (cursor >= bytes.length) {
								throw new Error(
									"This HDR file could not be decoded. Pixel data is truncated.",
								);
							}
							scanline[ptr * 4 + ch] = bytes[cursor++];
							ptr++;
						}
					}
				}
			}

			rgbe.set(scanline, y * width * 4);
		} else {
			// Uncompressed scanline: width * 4 bytes of raw RGBE
			const needed = width * 4;
			if (cursor + needed > bytes.length) {
				throw new Error(
					"This HDR file could not be decoded. Pixel data is truncated.",
				);
			}
			rgbe.set(bytes.subarray(cursor, cursor + needed), y * width * 4);
			cursor += needed;
		}
	}

	/* ---- 4. Convert RGBE to tone-mapped RGBA ---- */
	const rgba = new Uint8Array(width * height * 4);

	for (let i = 0; i < width * height; i++) {
		const ri = rgbe[i * 4];
		const gi = rgbe[i * 4 + 1];
		const bi = rgbe[i * 4 + 2];
		const ei = rgbe[i * 4 + 3];

		let r: number;
		let g: number;
		let b: number;

		if (ei === 0) {
			r = 0;
			g = 0;
			b = 0;
		} else {
			// RGBE to float: channel * 2^(E - 128)
			const scale = 2 ** (ei - 128);
			r = ri * scale;
			g = gi * scale;
			b = bi * scale;
		}

		// Reinhard tone mapping: v / (1 + v), then scale to 255
		rgba[i * 4] = Math.min(255, Math.round((r / (1 + r)) * 255));
		rgba[i * 4 + 1] = Math.min(255, Math.round((g / (1 + g)) * 255));
		rgba[i * 4 + 2] = Math.min(255, Math.round((b / (1 + b)) * 255));
		rgba[i * 4 + 3] = 255;
	}

	return { data: rgba, width, height };
}
