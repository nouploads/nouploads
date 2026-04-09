/**
 * Color Palette Extractor: extract dominant colors from an image using median-cut quantization.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const colorPalette: ToolDefinition = {
	id: "color-palette",
	name: "Color Palette Extractor",
	category: "image",
	description:
		"Extract dominant colors from an image as hex, RGB, and HSL values.",
	inputMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/bmp",
		"image/avif",
	],
	inputExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"],
	options: [
		{
			name: "count",
			type: "number",
			description: "Number of colors to extract (3-12)",
			default: 6,
			min: 3,
			max: 12,
		},
	],
	capabilities: ["browser"],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for color palette extraction");
		}
		const { imageBackend, onProgress } = context;
		const count = (options.count as number) ?? 6;

		onProgress?.(10);

		const decoded = await imageBackend.decode(input, "auto");

		onProgress?.(40);

		// Downsample by collecting pixels from the decoded image data
		const pixels: [number, number, number][] = [];
		const data = decoded.data;
		const totalPixels = decoded.width * decoded.height;
		// Sample up to ~10000 pixels for speed
		const step = Math.max(1, Math.floor(totalPixels / 10000));
		for (let i = 0; i < totalPixels; i += step) {
			const offset = i * 4;
			const r = data[offset];
			const g = data[offset + 1];
			const b = data[offset + 2];
			const a = data[offset + 3];
			// Skip fully transparent pixels
			if (a < 128) continue;
			pixels.push([r, g, b]);
		}

		onProgress?.(60);

		// Median-cut quantization
		const buckets = medianCut(pixels, count);
		const colors = buckets.map((bucket) => {
			const avg = averageColor(bucket);
			return {
				r: avg[0],
				g: avg[1],
				b: avg[2],
				hex: rgbToHex(avg[0], avg[1], avg[2]),
				hsl: rgbToHsl(avg[0], avg[1], avg[2]),
			};
		});

		onProgress?.(90);

		const output = new TextEncoder().encode(JSON.stringify(colors, null, 2));

		onProgress?.(100);

		return {
			output,
			extension: ".json",
			mimeType: "application/json",
			metadata: {
				colorCount: colors.length,
				colors: colors.map((c) => c.hex),
			},
		};
	},
};

function medianCut(
	pixels: [number, number, number][],
	targetCount: number,
): [number, number, number][][] {
	if (pixels.length === 0) return [];
	const buckets: [number, number, number][][] = [pixels];

	while (buckets.length < targetCount) {
		// Find the bucket with the greatest color range to split
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

function rgbToHex(r: number, g: number, b: number): string {
	return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

function rgbToHsl(
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

registerTool(colorPalette);

export { colorPalette };
