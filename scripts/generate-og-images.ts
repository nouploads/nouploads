#!/usr/bin/env npx tsx
/**
 * Pre-generate static OG images (SVG) for every tool page.
 *
 * Run: npx tsx scripts/generate-og-images.ts
 *
 * Output: apps/web/public/og/<slug>.svg  (one per route)
 *
 * These are served as static assets from S3/CDN — no server needed.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../apps/web/public/og");

// ── Tool list (duplicated from apps/web/app/lib/tools.ts to avoid import issues) ──
// We read the prerender list from react-router.config.ts instead — it's the
// canonical list of every public route.

interface PageInfo {
	path: string;
	title: string;
	description: string;
}

// Every prerendered route with its display info.
// Title/description derived from the path slug.
const PAGES: PageInfo[] = [
	{ path: "/", title: "NoUploads", description: "Privacy-first file tools that run entirely in your browser" },
	{ path: "/about", title: "About NoUploads", description: "Privacy-first file tools — no uploads, no servers" },
	// Image tools
	{ path: "/image", title: "Image Tools", description: "Convert, compress, resize images — free and private" },
	{ path: "/image/heic-to-jpg", title: "HEIC to JPG", description: "Convert iPhone HEIC photos to JPG format" },
	{ path: "/image/compress", title: "Image Compress", description: "Reduce image file size with adjustable quality" },
	{ path: "/image/compress-jpg", title: "Compress JPG", description: "Reduce JPG file size with adjustable quality" },
	{ path: "/image/compress-png", title: "Compress PNG", description: "Reduce PNG file size with color quantization" },
	{ path: "/image/compress-webp", title: "Compress WebP", description: "Reduce WebP file size with adjustable quality" },
	{ path: "/image/compress-gif", title: "Compress GIF", description: "Reduce animated GIF file size" },
	{ path: "/image/convert", title: "Image Convert", description: "Convert between HEIC, PNG, JPG, WebP, AVIF, and more" },
	{ path: "/image/jpg-to-png", title: "JPG to PNG", description: "Convert JPG images to lossless PNG format" },
	{ path: "/image/png-to-jpg", title: "PNG to JPG", description: "Convert PNG images to compact JPG format" },
	{ path: "/image/webp-to-jpg", title: "WebP to JPG", description: "Convert WebP images to universally compatible JPG" },
	{ path: "/image/webp-to-png", title: "WebP to PNG", description: "Convert WebP images to lossless PNG with transparency" },
	{ path: "/image/jpg-to-webp", title: "JPG to WebP", description: "Convert JPG images to modern WebP format" },
	{ path: "/image/png-to-webp", title: "PNG to WebP", description: "Convert PNG images to efficient WebP format" },
	{ path: "/image/svg-to-png", title: "SVG to PNG", description: "Rasterize SVG vector graphics to PNG images" },
	{ path: "/image/avif-to-jpg", title: "AVIF to JPG", description: "Convert AVIF images to widely compatible JPG" },
	{ path: "/image/avif-to-png", title: "AVIF to PNG", description: "Convert AVIF images to lossless PNG format" },
	{ path: "/image/gif-to-jpg", title: "GIF to JPG", description: "Convert GIF images to compact JPG format" },
	{ path: "/image/resize", title: "Image Resize", description: "Resize images by pixels, percentage, or presets" },
	{ path: "/image/crop", title: "Image Crop", description: "Crop images with custom or preset aspect ratios" },
	{ path: "/image/rotate", title: "Image Rotate & Flip", description: "Rotate images 90/180/270 degrees or flip" },
	{ path: "/image/exif", title: "EXIF Viewer", description: "View and strip photo metadata" },
	{ path: "/image/to-pdf", title: "Images to PDF", description: "Combine multiple images into a single PDF" },
	{ path: "/image/svg-to-jpg", title: "SVG to JPG", description: "Convert SVG vector graphics to JPG images" },
	{ path: "/image/svg-to-webp", title: "SVG to WebP", description: "Convert SVG vector graphics to WebP images" },
	{ path: "/image/remove-background", title: "Remove Background", description: "Remove image backgrounds using AI, locally" },
	{ path: "/image/watermark", title: "Image Watermark", description: "Add text watermark overlay to images" },
	{ path: "/image/tiff-to-jpg", title: "TIFF to JPG", description: "Convert TIFF images to compact JPG format" },
	{ path: "/image/tiff-to-png", title: "TIFF to PNG", description: "Convert TIFF images to lossless PNG format" },
	{ path: "/image/ico-to-png", title: "ICO to PNG", description: "Extract favicon ICO images as PNG" },
	{ path: "/image/ico-to-jpg", title: "ICO to JPG", description: "Convert ICO favicon files to JPG images" },
	{ path: "/image/jxl-to-jpg", title: "JXL to JPG", description: "Convert JPEG XL images to JPG" },
	{ path: "/image/jxl-to-png", title: "JXL to PNG", description: "Convert JPEG XL images to PNG format" },
	{ path: "/image/psd-converter", title: "PSD Converter", description: "Convert Photoshop PSD files to standard formats" },
	{ path: "/image/psb-converter", title: "PSB Converter", description: "Convert Photoshop Large Document PSB files" },
	{ path: "/image/tga-converter", title: "TGA Converter", description: "Convert Targa TGA textures to standard formats" },
	{ path: "/image/hdr-converter", title: "HDR Converter", description: "Convert Radiance HDR images to JPG, PNG, or WebP" },
	{ path: "/image/exr-converter", title: "EXR Converter", description: "Convert OpenEXR images to standard formats" },
	{ path: "/image/dds-converter", title: "DDS Converter", description: "Convert DDS game textures to standard formats" },
	{ path: "/image/pcx-converter", title: "PCX Converter", description: "Convert legacy PCX images to modern formats" },
	{ path: "/image/netpbm-converter", title: "Netpbm Converter", description: "Convert PBM, PGM, PPM, PNM, PAM, PFM formats" },
	{ path: "/image/fits-converter", title: "FITS Converter", description: "Convert FITS astronomy images to standard formats" },
	{ path: "/image/dcm-converter", title: "DICOM Converter", description: "Convert DICOM medical images to JPG or PNG" },
	{ path: "/image/raw-converter", title: "Camera RAW Converter", description: "Convert CR2, NEF, ARW, DNG and 20+ RAW formats" },
	{ path: "/image/jp2-converter", title: "JP2 Converter", description: "Convert JPEG 2000 to JPG, PNG, or WebP" },
	{ path: "/image/icns-converter", title: "ICNS Converter", description: "Convert macOS ICNS app icons to PNG or JPG" },
	{ path: "/image/eps-converter", title: "EPS Converter", description: "Extract preview images from EPS files" },
	{ path: "/image/ai-converter", title: "AI Converter", description: "Convert Adobe Illustrator AI files" },
	{ path: "/image/legacy-converter", title: "Legacy Converter", description: "Convert SGI, Sun Raster, WBMP, PCD, PICT, SFW" },
	{ path: "/image/svgz-converter", title: "SVGZ Converter", description: "Decompress SVGZ files and convert" },
	{ path: "/image/xps-converter", title: "XPS Converter", description: "Extract images from XPS/OXPS documents" },
	{ path: "/image/odg-converter", title: "ODG Converter", description: "Convert OpenDocument Graphics" },
	{ path: "/image/xcf-converter", title: "XCF Converter", description: "Convert GIMP XCF files to standard formats" },
	{ path: "/image/xwindow-converter", title: "X Window Converter", description: "Convert XBM, XPM, and XWD files" },
	{ path: "/image/cdr-converter", title: "CDR Converter", description: "Convert CorelDRAW CDR files" },
	{ path: "/image/vsd-converter", title: "Visio Converter", description: "Convert Visio VSD/VSDX diagrams" },
	{ path: "/image/pub-converter", title: "PUB Converter", description: "Extract images from Microsoft Publisher PUB files" },
	{ path: "/image/emf-converter", title: "EMF Converter", description: "Convert Windows EMF metafiles" },
	{ path: "/image/favicon-generator", title: "Favicon Generator", description: "Generate multi-size .ico favicon files from any image" },
	// PDF tools
	{ path: "/pdf", title: "PDF Tools", description: "Split, merge, rotate, watermark, compress PDF files" },
	{ path: "/pdf/pdf-to-jpg", title: "PDF to JPG", description: "Convert PDF pages to JPG images" },
	{ path: "/pdf/pdf-to-png", title: "PDF to PNG", description: "Convert PDF pages to lossless PNG images" },
	{ path: "/pdf/merge", title: "Merge PDFs", description: "Combine multiple PDF files into one document" },
	{ path: "/pdf/compress", title: "Compress PDF", description: "Reduce PDF file size by re-rendering" },
	{ path: "/pdf/split", title: "Split PDF", description: "Split a PDF into individual pages or custom ranges" },
	{ path: "/pdf/rotate", title: "Rotate PDF", description: "Rotate PDF pages by 90, 180, or 270 degrees" },
	{ path: "/pdf/pdf-to-text", title: "PDF to Text", description: "Extract all text content from PDF documents" },
	{ path: "/pdf/watermark", title: "Watermark PDF", description: "Add a text watermark to every page of a PDF" },
	// Vector tools
	{ path: "/vector", title: "Vector Tools", description: "SVG optimizer and vector format tools" },
	{ path: "/vector/svg-optimizer", title: "SVG Optimizer", description: "Minify and optimize SVG files with svgo" },
	// Developer tools
	{ path: "/developer", title: "Developer Tools", description: "Color picker, JSON formatter, hash generator, and more" },
	{ path: "/developer/color-picker", title: "Color Picker", description: "Pick colors and convert between HEX, RGB, HSL, OKLCH" },
	{ path: "/developer/base64-image", title: "Base64 Image", description: "Encode images to base64 or decode base64 to images" },
	{ path: "/developer/qr-code", title: "QR Code Generator", description: "Generate QR codes from text or URLs with custom styling" },
	{ path: "/developer/json-formatter", title: "JSON Formatter", description: "Validate, format, and minify JSON data" },
	{ path: "/developer/hash-generator", title: "Hash Generator", description: "Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes" },
	{ path: "/developer/jwt-decoder", title: "JWT Decoder", description: "Decode and inspect JWT tokens with expiration status" },
];

// ── SVG generator ──

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string[] {
	const words = text.split(" ");
	const lines: string[] = [];
	let current = "";
	for (const word of words) {
		if (current.length + word.length + 1 > maxChars) {
			if (current) lines.push(current);
			current = word;
		} else {
			current = current ? `${current} ${word}` : word;
		}
	}
	if (current) lines.push(current);
	return lines.slice(0, 3);
}

function generateOgSvg(title: string, description: string): string {
	const t = escapeXml(title);
	const descLines = wrapText(description, 55);
	const descTspans = descLines
		.map(
			(line, i) =>
				`<tspan x="110" dy="${i === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`,
		)
		.join("\n    ");

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="80" y="200" width="6" height="100" rx="3" fill="url(#accent)"/>
  <text x="110" y="255" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="56" font-weight="700" fill="#fafafa">${t}</text>
  <text x="110" y="320" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="26" fill="#a1a1aa">
    ${descTspans}
  </text>
  <text x="80" y="550" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="28" fill="#6366f1" font-weight="600">nouploads.com</text>
  <text x="1120" y="550" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="20" fill="#52525b" text-anchor="end">Free · Private · No Upload</text>
</svg>`;
}

// ── Main ──

function pathToSlug(path: string): string {
	if (path === "/") return "home";
	return path.replace(/^\//, "").replace(/\//g, "-");
}

mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const page of PAGES) {
	const slug = pathToSlug(page.path);
	const svg = generateOgSvg(page.title, page.description);
	const outPath = join(OUT_DIR, `${slug}.svg`);
	writeFileSync(outPath, svg);
	count++;
}

console.log(`Generated ${count} OG images in ${OUT_DIR}`);
