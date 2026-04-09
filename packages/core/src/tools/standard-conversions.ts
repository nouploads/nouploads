/**
 * Registers all mainstream image format conversion tools using the factory.
 * Each tool delegates to imageBackend.transcode() or decode()+encode().
 */

import { createImageConversionTool } from "./factory.js";

// --- PNG conversions ---
createImageConversionTool({
	from: "png",
	to: "jpg",
	description:
		"Convert PNG images to JPG format. Reduces file size by using lossy compression.",
});

createImageConversionTool({
	from: "png",
	to: "webp",
	description:
		"Convert PNG images to WebP format. Smaller files with quality control.",
});

// --- JPG conversions ---
createImageConversionTool({
	from: "jpg",
	to: "png",
	description:
		"Convert JPG images to PNG format. Lossless output preserves quality.",
});

createImageConversionTool({
	from: "jpg",
	to: "webp",
	description:
		"Convert JPG images to WebP format. Smaller files with quality control.",
});

// --- WebP conversions ---
createImageConversionTool({
	from: "webp",
	to: "jpg",
	description: "Convert WebP images to JPG format for broader compatibility.",
});

createImageConversionTool({
	from: "webp",
	to: "png",
	description:
		"Convert WebP images to PNG format. Lossless output preserves quality.",
});

// --- AVIF conversions ---
createImageConversionTool({
	from: "avif",
	to: "jpg",
	description: "Convert AVIF images to JPG format for broader compatibility.",
});

createImageConversionTool({
	from: "avif",
	to: "png",
	description:
		"Convert AVIF images to PNG format. Lossless output preserves quality.",
});

// --- GIF conversions ---
createImageConversionTool({
	from: "gif",
	to: "jpg",
	description:
		"Convert GIF images to JPG format. Extracts the first frame for static output.",
});

createImageConversionTool({
	from: "gif",
	to: "png",
	description:
		"Convert GIF images to PNG format. Extracts the first frame with transparency preserved.",
});

// --- BMP conversions ---
createImageConversionTool({
	from: "bmp",
	to: "jpg",
	description:
		"Convert BMP images to JPG format. Dramatically reduces file size.",
});

createImageConversionTool({
	from: "bmp",
	to: "png",
	description: "Convert BMP images to PNG format with lossless compression.",
});

// --- SVG conversions (rasterization) ---
createImageConversionTool({
	from: "svg",
	to: "png",
	description: "Rasterize SVG vector graphics to PNG format.",
});

createImageConversionTool({
	from: "svg",
	to: "jpg",
	description: "Rasterize SVG vector graphics to JPG format.",
});

createImageConversionTool({
	from: "svg",
	to: "webp",
	description: "Rasterize SVG vector graphics to WebP format.",
});

// TIFF conversions are in exotic-conversions.ts (with JS decoder fallback)

// --- BMP conversions ---
createImageConversionTool({
	from: "bmp",
	to: "webp",
	description:
		"Convert BMP images to WebP format. Dramatically reduces file size with modern compression.",
});

// --- ICO conversions ---
createImageConversionTool({
	from: "ico",
	to: "png",
	description:
		"Convert ICO icon files to PNG format. Extracts the largest icon frame.",
});

createImageConversionTool({
	from: "ico",
	to: "jpg",
	description: "Convert ICO icon files to JPG format.",
});

createImageConversionTool({
	from: "ico",
	to: "webp",
	description:
		"Convert ICO icon files to WebP format. Modern compression with transparency support.",
});
