/**
 * Image filters tool. Applies CSS-filter-semantics operations
 * (brightness, contrast, saturate, blur, hue-rotate, grayscale, sepia,
 * invert) to pixel data via the injected ImageBackend. All math is pure
 * and portable — no DOM or canvas access required — so the tool works
 * in any environment that can provide an ImageBackend.
 *
 * Filter chain order matches the CSS Filter Effects Module spec:
 * brightness → contrast → saturate → blur → hue-rotate → grayscale → sepia → invert.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "image-filters",
	name: "Image Filters",
	category: "image",
	description:
		"Apply visual filters and effects to images — grayscale, sepia, blur, brightness, contrast, and more.",
	inputMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/bmp",
		"image/tiff",
		"image/avif",
	],
	inputExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp"],
	options: [
		{
			name: "brightness",
			type: "number",
			description: "Brightness percentage (0-200, default 100)",
			default: 100,
			min: 0,
			max: 200,
		},
		{
			name: "contrast",
			type: "number",
			description: "Contrast percentage (0-200, default 100)",
			default: 100,
			min: 0,
			max: 200,
		},
		{
			name: "saturation",
			type: "number",
			description: "Saturation percentage (0-200, default 100)",
			default: 100,
			min: 0,
			max: 200,
		},
		{
			name: "blur",
			type: "number",
			description: "Blur radius in pixels (0-20, default 0)",
			default: 0,
			min: 0,
			max: 20,
		},
		{
			name: "hueRotate",
			type: "number",
			description: "Hue rotation in degrees (0-360, default 0)",
			default: 0,
			min: 0,
			max: 360,
		},
		{
			name: "grayscale",
			type: "number",
			description: "Grayscale percentage (0-100, default 0)",
			default: 0,
			min: 0,
			max: 100,
		},
		{
			name: "sepia",
			type: "number",
			description: "Sepia percentage (0-100, default 0)",
			default: 0,
			min: 0,
			max: 100,
		},
		{
			name: "invert",
			type: "number",
			description: "Invert percentage (0-100, default 0)",
			default: 0,
			min: 0,
			max: 100,
		},
		{
			name: "format",
			type: "string",
			description: "Output format",
			default: "png",
			choices: ["jpg", "jpeg", "png", "webp"],
		},
		{
			name: "quality",
			type: "number",
			description: "Output quality for lossy formats (1-100)",
			default: 92,
			min: 1,
			max: 100,
		},
	],
	capabilities: ["browser"],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for image-filters");
		}
		const { imageBackend, onProgress } = context;

		const brightness = numOpt(options.brightness, 100);
		const contrast = numOpt(options.contrast, 100);
		const saturation = numOpt(options.saturation, 100);
		const blur = numOpt(options.blur, 0);
		const hueRotate = numOpt(options.hueRotate, 0);
		const grayscale = numOpt(options.grayscale, 0);
		const sepia = numOpt(options.sepia, 0);
		const invert = numOpt(options.invert, 0);
		const formatRaw = (options.format as string) ?? "png";
		const format = formatRaw === "jpg" ? "jpeg" : formatRaw;
		const quality = numOpt(options.quality, 92);

		onProgress?.(10);

		const decoded = await imageBackend.decode(input, "auto");
		const { width, height } = decoded;
		const data = new Uint8ClampedArray(decoded.data);

		onProgress?.(40);

		applyPreBlur(data, brightness, contrast, saturation);
		if (blur > 0) gaussianBlur(data, width, height, blur);
		applyPostBlur(data, hueRotate, grayscale, sepia, invert);

		onProgress?.(80);

		const encoded = await imageBackend.encode(
			{ width, height, data: new Uint8Array(data.buffer) },
			{ format, quality },
		);

		onProgress?.(100);

		const extension =
			format === "jpeg" ? ".jpg" : format === "webp" ? ".webp" : ".png";
		const mimeType =
			format === "jpeg"
				? "image/jpeg"
				: format === "webp"
					? "image/webp"
					: "image/png";

		return {
			output: encoded,
			extension,
			mimeType,
			metadata: { width, height },
		};
	},
};

function numOpt(value: unknown, fallback: number): number {
	return typeof value === "number" ? value : fallback;
}

// ── Per-pixel filters applied before blur ──

function applyPreBlur(
	data: Uint8ClampedArray,
	brightness: number,
	contrast: number,
	saturation: number,
): void {
	if (brightness === 100 && contrast === 100 && saturation === 100) return;
	const bF = brightness / 100;
	const cF = contrast / 100;
	const sF = saturation / 100;
	const len = data.length;
	for (let i = 0; i < len; i += 4) {
		let r = data[i];
		let g = data[i + 1];
		let b = data[i + 2];
		if (brightness !== 100) {
			r *= bF;
			g *= bF;
			b *= bF;
		}
		if (contrast !== 100) {
			r = ((r / 255 - 0.5) * cF + 0.5) * 255;
			g = ((g / 255 - 0.5) * cF + 0.5) * 255;
			b = ((b / 255 - 0.5) * cF + 0.5) * 255;
		}
		if (saturation !== 100) {
			const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			r = gray + sF * (r - gray);
			g = gray + sF * (g - gray);
			b = gray + sF * (b - gray);
		}
		data[i] = r < 0 ? 0 : r > 255 ? 255 : (r + 0.5) | 0;
		data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : (g + 0.5) | 0;
		data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : (b + 0.5) | 0;
	}
}

// ── Per-pixel filters applied after blur ──

function applyPostBlur(
	data: Uint8ClampedArray,
	hueRotate: number,
	grayscale: number,
	sepia: number,
	invert: number,
): void {
	if (hueRotate === 0 && grayscale === 0 && sepia === 0 && invert === 0) return;
	const gF = grayscale / 100;
	const sepF = sepia / 100;
	const iF = invert / 100;

	// Precompute hue-rotation matrix (CSS Filter Effects Module §4)
	let hr00 = 1;
	let hr01 = 0;
	let hr02 = 0;
	let hr10 = 0;
	let hr11 = 1;
	let hr12 = 0;
	let hr20 = 0;
	let hr21 = 0;
	let hr22 = 1;
	if (hueRotate !== 0) {
		const a = (hueRotate * Math.PI) / 180;
		const c = Math.cos(a);
		const s = Math.sin(a);
		hr00 = 0.213 + 0.787 * c - 0.213 * s;
		hr01 = 0.715 - 0.715 * c - 0.715 * s;
		hr02 = 0.072 - 0.072 * c + 0.928 * s;
		hr10 = 0.213 - 0.213 * c + 0.143 * s;
		hr11 = 0.715 + 0.285 * c + 0.14 * s;
		hr12 = 0.072 - 0.072 * c - 0.283 * s;
		hr20 = 0.213 - 0.213 * c - 0.787 * s;
		hr21 = 0.715 - 0.715 * c + 0.715 * s;
		hr22 = 0.072 + 0.928 * c + 0.072 * s;
	}

	const len = data.length;
	for (let i = 0; i < len; i += 4) {
		let r = data[i];
		let g = data[i + 1];
		let b = data[i + 2];
		if (hueRotate !== 0) {
			const nr = hr00 * r + hr01 * g + hr02 * b;
			const ng = hr10 * r + hr11 * g + hr12 * b;
			const nb = hr20 * r + hr21 * g + hr22 * b;
			r = nr;
			g = ng;
			b = nb;
		}
		if (grayscale > 0) {
			const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			r += gF * (gray - r);
			g += gF * (gray - g);
			b += gF * (gray - b);
		}
		if (sepia > 0) {
			const sr = 0.393 * r + 0.769 * g + 0.189 * b;
			const sg = 0.349 * r + 0.686 * g + 0.168 * b;
			const sb = 0.272 * r + 0.534 * g + 0.131 * b;
			r += sepF * (sr - r);
			g += sepF * (sg - g);
			b += sepF * (sb - b);
		}
		if (invert > 0) {
			r += iF * (255 - 2 * r);
			g += iF * (255 - 2 * g);
			b += iF * (255 - 2 * b);
		}
		data[i] = r < 0 ? 0 : r > 255 ? 255 : (r + 0.5) | 0;
		data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : (g + 0.5) | 0;
		data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : (b + 0.5) | 0;
	}
}

// ── Gaussian blur via 3-pass box blur approximation ──

function gaussianBlur(
	data: Uint8ClampedArray,
	w: number,
	h: number,
	sigma: number,
): void {
	// Compute box sizes for 3-pass approximation (W3C CSS Filters spec §5)
	const wIdeal = Math.sqrt((12 * sigma * sigma) / 3 + 1);
	let wl = Math.floor(wIdeal);
	if (wl % 2 === 0) wl--;
	const wu = wl + 2;
	const m = Math.round(
		(12 * sigma * sigma - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4),
	);

	const temp = new Uint8ClampedArray(data.length);

	for (let pass = 0; pass < 3; pass++) {
		const r = (((pass < m ? wl : wu) - 1) / 2) | 0;
		if (r <= 0) continue;
		blurH(data, temp, w, h, r);
		blurV(temp, data, w, h, r);
	}
}

/** Horizontal box blur pass using running sums — O(w·h) regardless of radius */
function blurH(
	src: Uint8ClampedArray,
	dst: Uint8ClampedArray,
	w: number,
	h: number,
	r: number,
): void {
	const d = 2 * r + 1;
	for (let y = 0; y < h; y++) {
		let rs = 0;
		let gs = 0;
		let bs = 0;
		let as = 0;
		for (let dx = -r; dx <= r; dx++) {
			const i = (y * w + Math.max(0, Math.min(w - 1, dx))) * 4;
			rs += src[i];
			gs += src[i + 1];
			bs += src[i + 2];
			as += src[i + 3];
		}
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			dst[i] = (rs / d + 0.5) | 0;
			dst[i + 1] = (gs / d + 0.5) | 0;
			dst[i + 2] = (bs / d + 0.5) | 0;
			dst[i + 3] = (as / d + 0.5) | 0;
			const ai = (y * w + Math.min(w - 1, x + r + 1)) * 4;
			const ri = (y * w + Math.max(0, x - r)) * 4;
			rs += src[ai] - src[ri];
			gs += src[ai + 1] - src[ri + 1];
			bs += src[ai + 2] - src[ri + 2];
			as += src[ai + 3] - src[ri + 3];
		}
	}
}

/** Vertical box blur pass using running sums — O(w·h) regardless of radius */
function blurV(
	src: Uint8ClampedArray,
	dst: Uint8ClampedArray,
	w: number,
	h: number,
	r: number,
): void {
	const d = 2 * r + 1;
	for (let x = 0; x < w; x++) {
		let rs = 0;
		let gs = 0;
		let bs = 0;
		let as = 0;
		for (let dy = -r; dy <= r; dy++) {
			const i = (Math.max(0, Math.min(h - 1, dy)) * w + x) * 4;
			rs += src[i];
			gs += src[i + 1];
			bs += src[i + 2];
			as += src[i + 3];
		}
		for (let y = 0; y < h; y++) {
			const i = (y * w + x) * 4;
			dst[i] = (rs / d + 0.5) | 0;
			dst[i + 1] = (gs / d + 0.5) | 0;
			dst[i + 2] = (bs / d + 0.5) | 0;
			dst[i + 3] = (as / d + 0.5) | 0;
			const ai = (Math.min(h - 1, y + r + 1) * w + x) * 4;
			const ri = (Math.max(0, y - r) * w + x) * 4;
			rs += src[ai] - src[ri];
			gs += src[ai + 1] - src[ri + 1];
			bs += src[ai + 2] - src[ri + 2];
			as += src[ai + 3] - src[ri + 3];
		}
	}
}

registerTool(tool);
export default tool;
