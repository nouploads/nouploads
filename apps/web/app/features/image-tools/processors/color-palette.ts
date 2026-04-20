/**
 * Color palette extractor — web adapter. Runs @nouploads/core/tools/color-palette
 * in the image-pipeline worker and decodes the tool's JSON output.
 *
 * Pure helpers (rgbToHex / rgbToHsl / formatters / CSS generators / the
 * ImageData-shaped extractPalette) stay here so the component can format
 * copy-to-clipboard output without a second round trip.
 */
import type {} from "@nouploads/core/tools/color-palette";
import { runInPipeline } from "../lib/run-in-pipeline";

export interface PaletteColor {
	r: number;
	g: number;
	b: number;
	hex: string;
	hsl: { h: number; s: number; l: number };
}

/**
 * Extract a color palette from an image file. Dispatches the decode +
 * median-cut work to the core tool via the pipeline worker.
 */
export async function extractPaletteFromFile(
	file: File,
	colorCount: number,
	signal?: AbortSignal,
): Promise<PaletteColor[]> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
	const bytes = new Uint8Array(await file.arrayBuffer());
	const result = await runInPipeline({
		toolId: "color-palette",
		input: bytes,
		options: { count: colorCount },
		signal,
	});
	const text = new TextDecoder().decode(result.output);
	return JSON.parse(text) as PaletteColor[];
}

/**
 * Extract dominant colors from raw ImageData using median-cut quantization.
 * Pure function, kept in the web layer for synchronous use (tests, in-UI
 * preview computations).
 */
export function extractPalette(
	imageData: { data: Uint8ClampedArray; width: number; height: number },
	colorCount: number,
): PaletteColor[] {
	const pixels = downsamplePixels(imageData);
	if (pixels.length === 0) return [];

	const buckets = medianCut(pixels, colorCount);
	return buckets.map((bucket) => {
		const avg = averageColor(bucket);
		return {
			r: avg[0],
			g: avg[1],
			b: avg[2],
			hex: rgbToHex(avg[0], avg[1], avg[2]),
			hsl: rgbToHsl(avg[0], avg[1], avg[2]),
		};
	});
}

function downsamplePixels(imageData: {
	data: Uint8ClampedArray;
	width: number;
	height: number;
}): [number, number, number][] {
	const { data, width, height } = imageData;
	const totalPixels = width * height;
	const pixels: [number, number, number][] = [];

	for (let i = 0; i < totalPixels; i++) {
		const offset = i * 4;
		const a = data[offset + 3];
		if (a < 128) continue; // skip transparent
		pixels.push([data[offset], data[offset + 1], data[offset + 2]]);
	}

	return pixels;
}

function medianCut(
	pixels: [number, number, number][],
	targetCount: number,
): [number, number, number][][] {
	if (pixels.length === 0) return [];
	const buckets: [number, number, number][][] = [pixels];

	while (buckets.length < targetCount) {
		let maxRange = -1;
		let maxIdx = 0;
		let splitChannel = 0;

		for (let i = 0; i < buckets.length; i++) {
			const bucket = buckets[i];
			if (bucket.length < 2) continue;

			for (let ch = 0; ch < 3; ch++) {
				let min = 255;
				let max = 0;
				for (const px of bucket) {
					if (px[ch] < min) min = px[ch];
					if (px[ch] > max) max = px[ch];
				}
				const range = max - min;
				if (range > maxRange) {
					maxRange = range;
					maxIdx = i;
					splitChannel = ch;
				}
			}
		}

		if (maxRange <= 0) break;

		const toSplit = buckets[maxIdx];
		toSplit.sort((a, b) => a[splitChannel] - b[splitChannel]);
		const mid = Math.floor(toSplit.length / 2);
		const left = toSplit.slice(0, mid);
		const right = toSplit.slice(mid);

		buckets.splice(maxIdx, 1, left, right);
	}

	return buckets.filter((b) => b.length > 0);
}

function averageColor(
	pixels: [number, number, number][],
): [number, number, number] {
	let r = 0;
	let g = 0;
	let b = 0;
	for (const px of pixels) {
		r += px[0];
		g += px[1];
		b += px[2];
	}
	const len = pixels.length;
	return [Math.round(r / len), Math.round(g / len), Math.round(b / len)];
}

export function rgbToHex(r: number, g: number, b: number): string {
	return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

export function rgbToHsl(
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
		else if (max === gn) h = ((bn - rn) / d + 2) / 6;
		else h = ((rn - gn) / d + 4) / 6;
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

export function formatHsl(hsl: { h: number; s: number; l: number }): string {
	return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

export function formatRgb(r: number, g: number, b: number): string {
	return `rgb(${r}, ${g}, ${b})`;
}

export function paletteToCssVariables(colors: PaletteColor[]): string {
	return colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n");
}

export function paletteToTailwind(colors: PaletteColor[]): string {
	const entries = colors.map((c, i) => `  '${i + 1}': '${c.hex}',`).join("\n");
	return `colors: {\n${entries}\n}`;
}
