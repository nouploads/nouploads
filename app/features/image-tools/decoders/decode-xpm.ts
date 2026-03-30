import type { DecodedImage } from "./types";

/**
 * Common X11 color names mapped to [R, G, B] values.
 * Only the most frequently used subset — XPM files with exotic names
 * should use #RRGGBB hex instead.
 */
const X11_COLORS: Record<string, [number, number, number]> = {
	black: [0, 0, 0],
	white: [255, 255, 255],
	red: [255, 0, 0],
	green: [0, 128, 0],
	blue: [0, 0, 255],
	yellow: [255, 255, 0],
	cyan: [0, 255, 255],
	magenta: [255, 0, 255],
	gray: [128, 128, 128],
	grey: [128, 128, 128],
	orange: [255, 165, 0],
	pink: [255, 192, 203],
	purple: [128, 0, 128],
	brown: [165, 42, 42],
	navy: [0, 0, 128],
	maroon: [128, 0, 0],
	olive: [128, 128, 0],
	teal: [0, 128, 128],
	silver: [192, 192, 192],
	lime: [0, 255, 0],
	aqua: [0, 255, 255],
};

/**
 * Decode an XPM (X PixMap) file to raw RGBA pixels.
 *
 * Custom parser — no external library. XPM is a C source file containing:
 * - A data array of quoted strings
 * - First string: "width height ncolors cpp [hotspot_x hotspot_y]"
 * - Next ncolors strings: color definitions mapping character(s) to colors
 * - Remaining height strings: pixel rows (width * cpp characters each)
 *
 * Color values can be #RRGGBB hex, "None" (transparent), or X11 color names.
 */
export async function decodeXpm(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const text = await input.text();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Extract all quoted strings from the C data array
	const strings: string[] = [];
	const stringRegex = /"([^"]*)"/g;
	let match: RegExpExecArray | null;
	match = stringRegex.exec(text);
	while (match !== null) {
		strings.push(match[1]);
		match = stringRegex.exec(text);
	}

	if (strings.length < 2) {
		throw new Error(
			"This XPM file could not be decoded. Not enough data strings found.",
		);
	}

	// Parse header string: "width height ncolors cpp [hotspot_x hotspot_y]"
	const headerParts = strings[0].trim().split(/\s+/);
	if (headerParts.length < 4) {
		throw new Error(
			"This XPM file could not be decoded. Invalid header string.",
		);
	}

	const width = Number.parseInt(headerParts[0], 10);
	const height = Number.parseInt(headerParts[1], 10);
	const ncolors = Number.parseInt(headerParts[2], 10);
	const cpp = Number.parseInt(headerParts[3], 10);

	if (
		Number.isNaN(width) ||
		Number.isNaN(height) ||
		Number.isNaN(ncolors) ||
		Number.isNaN(cpp)
	) {
		throw new Error(
			"This XPM file could not be decoded. Non-numeric header values.",
		);
	}

	if (width <= 0 || height <= 0) {
		throw new Error(
			"This XPM file could not be decoded. Image dimensions are invalid.",
		);
	}

	if (width > 16384 || height > 16384) {
		throw new Error(
			"This XPM file could not be decoded. Image dimensions exceed 16384.",
		);
	}

	if (ncolors <= 0 || cpp <= 0) {
		throw new Error(
			"This XPM file could not be decoded. Invalid color count or chars-per-pixel.",
		);
	}

	const expectedStrings = 1 + ncolors + height;
	if (strings.length < expectedStrings) {
		throw new Error(
			"This XPM file could not be decoded. Not enough data strings.",
		);
	}

	// Parse color definitions
	const colorMap = new Map<string, [number, number, number, number]>();

	for (let i = 1; i <= ncolors; i++) {
		const line = strings[i];
		// The first cpp characters are the key
		const chars = line.substring(0, cpp);
		// Find the color specifier after "c " (case insensitive search)
		const rest = line.substring(cpp);
		const colorMatch = rest.match(/\bc\s+(.+?)(?:\s+[sgm]\s|$)/i);
		if (!colorMatch) {
			throw new Error(
				`This XPM file could not be decoded. Invalid color definition at line ${i}.`,
			);
		}

		const colorValue = colorMatch[1].trim().toLowerCase();

		if (colorValue === "none") {
			colorMap.set(chars, [0, 0, 0, 0]);
		} else if (colorValue.startsWith("#")) {
			const rgba = parseHexColor(colorValue);
			if (!rgba) {
				throw new Error(
					`This XPM file could not be decoded. Invalid hex color "${colorValue}".`,
				);
			}
			colorMap.set(chars, rgba);
		} else {
			const x11 = X11_COLORS[colorValue];
			if (x11) {
				colorMap.set(chars, [x11[0], x11[1], x11[2], 255]);
			} else {
				// Unknown color name — default to magenta to make it visible
				colorMap.set(chars, [255, 0, 255, 255]);
			}
		}
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Parse pixel rows
	const rgba = new Uint8Array(width * height * 4);

	for (let y = 0; y < height; y++) {
		const row = strings[1 + ncolors + y];
		for (let x = 0; x < width; x++) {
			const chars = row.substring(x * cpp, x * cpp + cpp);
			const color = colorMap.get(chars);
			if (!color) {
				throw new Error(
					`This XPM file could not be decoded. Unknown pixel character "${chars}" at (${x}, ${y}).`,
				);
			}
			const dst = (y * width + x) * 4;
			rgba[dst] = color[0];
			rgba[dst + 1] = color[1];
			rgba[dst + 2] = color[2];
			rgba[dst + 3] = color[3];
		}
	}

	return { data: rgba, width, height };
}

/**
 * Parse a hex color string (#RGB, #RRGGBB, or #RRRRGGGGBBBB) to [R, G, B, 255].
 */
function parseHexColor(hex: string): [number, number, number, number] | null {
	const h = hex.substring(1);
	if (h.length === 3) {
		const r = Number.parseInt(h[0] + h[0], 16);
		const g = Number.parseInt(h[1] + h[1], 16);
		const b = Number.parseInt(h[2] + h[2], 16);
		return [r, g, b, 255];
	}
	if (h.length === 6) {
		const r = Number.parseInt(h.substring(0, 2), 16);
		const g = Number.parseInt(h.substring(2, 4), 16);
		const b = Number.parseInt(h.substring(4, 6), 16);
		return [r, g, b, 255];
	}
	if (h.length === 12) {
		// 16-bit per channel — take high byte of each
		const r = Number.parseInt(h.substring(0, 2), 16);
		const g = Number.parseInt(h.substring(4, 6), 16);
		const b = Number.parseInt(h.substring(8, 10), 16);
		return [r, g, b, 255];
	}
	return null;
}
