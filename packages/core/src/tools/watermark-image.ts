/**
 * Image watermark tool. Renders text on top of the decoded image using
 * the ambient OffscreenCanvas (browser/worker context) and re-encodes
 * via the injected ImageBackend. The canvas dependency is what keeps
 * the tool's capabilities set to ["browser"] — canvas backends running
 * inside a Web Worker satisfy this; bare Node does not.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "watermark-image",
	name: "Image Watermark",
	category: "image",
	description:
		"Add a text watermark overlay to images. Supports centered or tiled placement.",
	inputMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/bmp",
		"image/tiff",
		"image/avif",
	],
	inputExtensions: [
		".jpg",
		".jpeg",
		".png",
		".webp",
		".gif",
		".bmp",
		".tiff",
		".tif",
		".avif",
	],
	options: [
		{
			name: "text",
			type: "string",
			description: "Watermark text",
			default: "SAMPLE",
		},
		{
			name: "fontSize",
			type: "number",
			description: "Font size in pixels",
			default: 48,
			min: 12,
			max: 200,
		},
		{
			name: "opacity",
			type: "number",
			description: "Watermark opacity (0.1-1.0)",
			default: 0.3,
			min: 0.1,
			max: 1.0,
		},
		{
			name: "rotation",
			type: "number",
			description: "Rotation in degrees",
			default: -30,
			min: -90,
			max: 90,
		},
		{
			name: "color",
			type: "string",
			description: "Watermark color as hex",
			default: "#000000",
		},
		{
			name: "mode",
			type: "string",
			description: "Placement mode: center or tiled",
			default: "center",
			choices: ["center", "tiled"],
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
			throw new Error("Image backend required for watermark-image");
		}
		if (typeof OffscreenCanvas === "undefined") {
			throw new Error(
				"watermark-image requires an OffscreenCanvas context — run it inside a browser Web Worker.",
			);
		}
		const { imageBackend, onProgress } = context;

		const text = (options.text as string) ?? "SAMPLE";
		const fontSize = numOpt(options.fontSize, 48);
		const opacity = numOpt(options.opacity, 0.3);
		const rotation = numOpt(options.rotation, -30);
		const color = (options.color as string) ?? "#000000";
		const mode = ((options.mode as string) ?? "center") as "center" | "tiled";
		const formatRaw = (options.format as string) ?? "png";
		const format = formatRaw === "jpg" ? "jpeg" : formatRaw;
		const quality = numOpt(options.quality, 92);

		onProgress?.(10);

		const decoded = await imageBackend.decode(input, "auto");
		const { width, height } = decoded;

		onProgress?.(30);

		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("Could not get OffscreenCanvas 2D context");
		}

		const imgData = new globalThis.ImageData(
			new Uint8ClampedArray(decoded.data),
			width,
			height,
		);
		ctx.putImageData(imgData, 0, 0);

		onProgress?.(50);

		ctx.globalAlpha = opacity;
		ctx.fillStyle = color;
		ctx.font = `${fontSize}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		const rotationRad = (rotation * Math.PI) / 180;

		if (mode === "tiled") {
			const spacingX = fontSize * 6;
			const spacingY = fontSize * 4;
			for (let y = -height; y < height * 2; y += spacingY) {
				for (let x = -width; x < width * 2; x += spacingX) {
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(rotationRad);
					ctx.fillText(text, 0, 0);
					ctx.restore();
				}
			}
		} else {
			ctx.save();
			ctx.translate(width / 2, height / 2);
			ctx.rotate(rotationRad);
			ctx.fillText(text, 0, 0);
			ctx.restore();
		}

		onProgress?.(70);

		// Read back the watermarked pixels and hand to the backend's
		// encode(), so output format follows the same pipeline as the
		// rest of the image tools.
		const watermarkedPixels = ctx.getImageData(0, 0, width, height);
		const encoded = await imageBackend.encode(
			{
				width,
				height,
				data: new Uint8Array(watermarkedPixels.data.buffer),
			},
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

registerTool(tool);
export default tool;
