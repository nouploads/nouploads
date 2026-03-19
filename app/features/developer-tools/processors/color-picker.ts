import {
	converter,
	formatHex,
	type Hsl,
	type Hsv,
	type Hwb,
	type Lab,
	type Lch,
	type Oklch,
	parse,
	type Rgb,
} from "culori";

export type ColorFormat =
	| "hex"
	| "rgb"
	| "hsl"
	| "hsv"
	| "hwb"
	| "cmyk"
	| "lab"
	| "lch"
	| "xyz"
	| "luv"
	| "oklch";

const toOklch = converter("oklch");
const toRgb = converter("rgb");
const toHsl = converter("hsl");
const toHsv = converter("hsv");
const toHwb = converter("hwb");
const toLab = converter("lab");
const toLch = converter("lch");
const toXyz = converter("xyz65");
const toLuv = converter("luv");

/**
 * Parse any CSS color string into a hex value.
 * Returns null if the input is not a valid color.
 */
export function parseToHex(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	// Try culori first
	try {
		const color = parse(trimmed);
		if (color) return formatHex(color);
	} catch {
		// fall through
	}

	// Try bare comma-separated values by wrapping with common CSS functions
	// This handles compact notation like "255, 0, 0" from formatColor()
	if (/^\d/.test(trimmed) && trimmed.includes(",")) {
		for (const fn of ["rgb", "hsl", "hwb", "lab", "lch", "oklch"]) {
			try {
				const color = parse(`${fn}(${trimmed})`);
				if (color) return formatHex(color);
			} catch {
				// try next
			}
		}
	}

	// Try parsing manual CMYK format: cmyk(c%, m%, y%, k%)
	const cmykMatch = trimmed.match(
		/^cmyk\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i,
	);
	if (cmykMatch) {
		const [, cs, ms, ys, ks] = cmykMatch;
		const c = Number(cs) / 100;
		const m = Number(ms) / 100;
		const y = Number(ys) / 100;
		const k = Number(ks) / 100;
		const r = Math.round(255 * (1 - c) * (1 - k));
		const g = Math.round(255 * (1 - m) * (1 - k));
		const b = Math.round(255 * (1 - y) * (1 - k));
		return formatHex({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255 });
	}

	return null;
}

/**
 * Format a hex color into the requested format string.
 */
export function formatColor(hex: string, format: ColorFormat): string {
	const color = parse(hex);
	if (!color) return hex;

	switch (format) {
		case "hex":
			return formatHex(color);
		case "rgb": {
			const rgb = toRgb(color) as Rgb;
			return `${round(rgb.r * 255, 0)}, ${round(rgb.g * 255, 0)}, ${round(rgb.b * 255, 0)}`;
		}
		case "hsl": {
			const hsl = toHsl(color) as Hsl;
			return `${round(hsl.h ?? 0, 0)}, ${round(hsl.s * 100, 0)}, ${round(hsl.l * 100, 0)}`;
		}
		case "hsv": {
			const hsv = toHsv(color) as Hsv;
			return `${round(hsv.h ?? 0, 0)}, ${round(hsv.s * 100, 0)}, ${round(hsv.v * 100, 0)}`;
		}
		case "hwb": {
			const hwb = toHwb(color) as Hwb;
			return `${round(hwb.h ?? 0, 0)}, ${round(hwb.w * 100, 0)}, ${round(hwb.b * 100, 0)}`;
		}
		case "cmyk": {
			const rgb = toRgb(color) as Rgb;
			const r = rgb.r;
			const g = rgb.g;
			const b = rgb.b;
			const k = 1 - Math.max(r, g, b);
			if (k === 1) return "0, 0, 0, 100";
			const c = round(((1 - r - k) / (1 - k)) * 100, 0);
			const m = round(((1 - g - k) / (1 - k)) * 100, 0);
			const y = round(((1 - b - k) / (1 - k)) * 100, 0);
			return `${c}, ${m}, ${y}, ${round(k * 100, 0)}`;
		}
		case "lab": {
			const lab = toLab(color) as Lab;
			return `${round(lab.l, 0)}, ${round(lab.a, 0)}, ${round(lab.b, 0)}`;
		}
		case "lch": {
			const lch = toLch(color) as Lch;
			return `${round(lch.l, 0)}, ${round(lch.c, 0)}, ${round(lch.h ?? 0, 0)}`;
		}
		case "xyz": {
			const xyz = toXyz(color);
			return `${round(xyz.x * 100, 0)}, ${round(xyz.y * 100, 0)}, ${round(xyz.z * 100, 0)}`;
		}
		case "luv": {
			const luv = toLuv(color);
			return `${round(luv.l, 0)}, ${round(luv.u, 0)}, ${round(luv.v, 0)}`;
		}
		case "oklch": {
			const oklch = toOklch(color) as Oklch;
			if (!oklch) return hex;
			const l = round(oklch.l, 3);
			const c = round(oklch.c, 3);
			const h = round(oklch.h ?? 0, 1);
			return `${l}, ${c}, ${h}`;
		}
	}
}

/** All format definitions with labels for display. */
export const FORMAT_DEFS: { key: ColorFormat; label: string }[] = [
	{ key: "hex", label: "HEX" },
	{ key: "rgb", label: "RGB" },
	{ key: "hsl", label: "HSL" },
	{ key: "hsv", label: "HSV" },
	{ key: "hwb", label: "HWB" },
	{ key: "cmyk", label: "CMYK" },
	{ key: "lab", label: "LAB" },
	{ key: "lch", label: "LCH" },
	{ key: "xyz", label: "XYZ" },
	{ key: "luv", label: "LUV" },
	{ key: "oklch", label: "OKLCH" },
];

/**
 * Get all format representations of a hex color.
 */
export function allFormats(hex: string): Record<ColorFormat, string> {
	const result = {} as Record<ColorFormat, string>;
	for (const { key } of FORMAT_DEFS) {
		result[key] = formatColor(hex, key);
	}
	return result;
}

/**
 * Calculate relative luminance of a color (WCAG 2.1 definition).
 */
export function relativeLuminance(hex: string): number {
	const parsed = parse(hex);
	if (!parsed) return 0;
	const color = toRgb(parsed);
	if (!color) return 0;

	const [rs, gs, bs] = [color.r, color.g, color.b].map((c) => {
		const s = Math.max(0, Math.min(1, c));
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});

	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * WCAG 2.1 contrast ratio between two colors.
 */
export function contrastRatio(hex1: string, hex2: string): number {
	const l1 = relativeLuminance(hex1);
	const l2 = relativeLuminance(hex2);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns whether white or black text has better contrast on the given background.
 */
export function bestTextColor(bgHex: string): "#ffffff" | "#000000" {
	const whiteContrast = contrastRatio(bgHex, "#ffffff");
	const blackContrast = contrastRatio(bgHex, "#000000");
	return whiteContrast >= blackContrast ? "#ffffff" : "#000000";
}

/**
 * WCAG AA compliance level for a given contrast ratio.
 */
export function wcagLevel(ratio: number): "AAA" | "AA" | "Fail" {
	if (ratio >= 7) return "AAA";
	if (ratio >= 4.5) return "AA";
	return "Fail";
}

/**
 * Generate a random hex color.
 */
export function randomHexColor(): string {
	const r = Math.floor(Math.random() * 256);
	const g = Math.floor(Math.random() * 256);
	const b = Math.floor(Math.random() * 256);
	return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function round(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}
