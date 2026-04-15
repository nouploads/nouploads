/**
 * Hand-curated related tools for internal linking.
 * Each tool page shows 3-5 genuinely related tools (workflow adjacency).
 */
export const relatedToolsMap: Record<
	string,
	{ title: string; href: string }[]
> = {
	// ── Image conversions ──
	"/image/heic-to-jpg": [
		{ title: "HEIC to PNG", href: "/image/heic-to-png" },
		{ title: "HEIC to WebP", href: "/image/heic-to-webp" },
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "Strip Metadata", href: "/image/strip-metadata" },
	],
	"/image/heic-to-png": [
		{ title: "HEIC to JPG", href: "/image/heic-to-jpg" },
		{ title: "HEIC to WebP", href: "/image/heic-to-webp" },
		{ title: "PNG to WebP", href: "/image/png-to-webp" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/heic-to-webp": [
		{ title: "HEIC to JPG", href: "/image/heic-to-jpg" },
		{ title: "HEIC to PNG", href: "/image/heic-to-png" },
		{ title: "Compress WebP", href: "/image/compress-webp" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/jpg-to-png": [
		{ title: "PNG to JPG", href: "/image/png-to-jpg" },
		{ title: "JPG to WebP", href: "/image/jpg-to-webp" },
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "Strip Metadata", href: "/image/strip-metadata" },
	],
	"/image/png-to-jpg": [
		{ title: "JPG to PNG", href: "/image/jpg-to-png" },
		{ title: "PNG to WebP", href: "/image/png-to-webp" },
		{ title: "Compress JPG", href: "/image/compress-jpg" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/webp-to-jpg": [
		{ title: "WebP to PNG", href: "/image/webp-to-png" },
		{ title: "JPG to WebP", href: "/image/jpg-to-webp" },
		{ title: "Compress JPG", href: "/image/compress-jpg" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/webp-to-png": [
		{ title: "WebP to JPG", href: "/image/webp-to-jpg" },
		{ title: "PNG to WebP", href: "/image/png-to-webp" },
		{ title: "Compress PNG", href: "/image/compress-png" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/jpg-to-webp": [
		{ title: "WebP to JPG", href: "/image/webp-to-jpg" },
		{ title: "PNG to WebP", href: "/image/png-to-webp" },
		{ title: "Compress WebP", href: "/image/compress-webp" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/png-to-webp": [
		{ title: "WebP to PNG", href: "/image/webp-to-png" },
		{ title: "JPG to WebP", href: "/image/jpg-to-webp" },
		{ title: "Compress WebP", href: "/image/compress-webp" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/svg-to-png": [
		{ title: "SVG to JPG", href: "/image/svg-to-jpg" },
		{ title: "SVG to WebP", href: "/image/svg-to-webp" },
		{ title: "SVG Optimizer", href: "/vector/svg-optimizer" },
		{ title: "Favicon Generator", href: "/image/favicon-generator" },
	],
	"/image/svg-to-jpg": [
		{ title: "SVG to PNG", href: "/image/svg-to-png" },
		{ title: "SVG to WebP", href: "/image/svg-to-webp" },
		{ title: "SVG Optimizer", href: "/vector/svg-optimizer" },
	],
	"/image/svg-to-webp": [
		{ title: "SVG to PNG", href: "/image/svg-to-png" },
		{ title: "SVG to JPG", href: "/image/svg-to-jpg" },
		{ title: "SVG Optimizer", href: "/vector/svg-optimizer" },
	],
	"/image/avif-to-jpg": [
		{ title: "AVIF to PNG", href: "/image/avif-to-png" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Compress JPG", href: "/image/compress-jpg" },
	],
	"/image/avif-to-png": [
		{ title: "AVIF to JPG", href: "/image/avif-to-jpg" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Compress PNG", href: "/image/compress-png" },
	],
	"/image/gif-to-jpg": [
		{ title: "GIF to PNG", href: "/image/gif-to-png" },
		{ title: "Compress GIF", href: "/image/compress-gif" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/gif-to-png": [
		{ title: "GIF to JPG", href: "/image/gif-to-jpg" },
		{ title: "Compress GIF", href: "/image/compress-gif" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/tiff-to-jpg": [
		{ title: "TIFF to PNG", href: "/image/tiff-to-png" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Compress JPG", href: "/image/compress-jpg" },
	],
	"/image/tiff-to-png": [
		{ title: "TIFF to JPG", href: "/image/tiff-to-jpg" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Compress PNG", href: "/image/compress-png" },
	],
	"/image/bmp-to-jpg": [
		{ title: "BMP to PNG", href: "/image/bmp-to-png" },
		{ title: "BMP to WebP", href: "/image/bmp-to-webp" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/bmp-to-png": [
		{ title: "BMP to JPG", href: "/image/bmp-to-jpg" },
		{ title: "BMP to WebP", href: "/image/bmp-to-webp" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/bmp-to-webp": [
		{ title: "BMP to JPG", href: "/image/bmp-to-jpg" },
		{ title: "BMP to PNG", href: "/image/bmp-to-png" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/ico-to-png": [
		{ title: "ICO to JPG", href: "/image/ico-to-jpg" },
		{ title: "ICO to WebP", href: "/image/ico-to-webp" },
		{ title: "Favicon Generator", href: "/image/favicon-generator" },
	],
	"/image/ico-to-jpg": [
		{ title: "ICO to PNG", href: "/image/ico-to-png" },
		{ title: "ICO to WebP", href: "/image/ico-to-webp" },
		{ title: "Favicon Generator", href: "/image/favicon-generator" },
	],
	"/image/ico-to-webp": [
		{ title: "ICO to PNG", href: "/image/ico-to-png" },
		{ title: "ICO to JPG", href: "/image/ico-to-jpg" },
		{ title: "Favicon Generator", href: "/image/favicon-generator" },
	],
	"/image/jxl-to-jpg": [
		{ title: "JXL to PNG", href: "/image/jxl-to-png" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Compress JPG", href: "/image/compress-jpg" },
	],
	"/image/jxl-to-png": [
		{ title: "JXL to JPG", href: "/image/jxl-to-jpg" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Compress PNG", href: "/image/compress-png" },
	],

	// ── Image compression ──
	"/image/compress": [
		{ title: "Compress JPG", href: "/image/compress-jpg" },
		{ title: "Compress PNG", href: "/image/compress-png" },
		{ title: "Compress WebP", href: "/image/compress-webp" },
		{ title: "Image Resize", href: "/image/resize" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/compress-jpg": [
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "JPG to WebP", href: "/image/jpg-to-webp" },
		{ title: "Image Resize", href: "/image/resize" },
		{ title: "Strip Metadata", href: "/image/strip-metadata" },
	],
	"/image/compress-png": [
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "PNG to WebP", href: "/image/png-to-webp" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/compress-webp": [
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "WebP to JPG", href: "/image/webp-to-jpg" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/compress-gif": [
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "GIF to JPG", href: "/image/gif-to-jpg" },
		{ title: "GIF to PNG", href: "/image/gif-to-png" },
	],

	// ── Image editing ──
	"/image/convert": [
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "Image Resize", href: "/image/resize" },
		{ title: "HEIC to JPG", href: "/image/heic-to-jpg" },
		{ title: "PNG to JPG", href: "/image/png-to-jpg" },
	],
	"/image/resize": [
		{ title: "Image Crop", href: "/image/crop" },
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Image Rotate", href: "/image/rotate" },
	],
	"/image/crop": [
		{ title: "Image Resize", href: "/image/resize" },
		{ title: "Image Rotate", href: "/image/rotate" },
		{ title: "Image Compress", href: "/image/compress" },
	],
	"/image/rotate": [
		{ title: "Image Crop", href: "/image/crop" },
		{ title: "Image Resize", href: "/image/resize" },
		{ title: "Image Filters", href: "/image/filters" },
	],
	"/image/exif": [
		{ title: "Strip Metadata", href: "/image/strip-metadata" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "HEIC to JPG", href: "/image/heic-to-jpg" },
	],
	"/image/strip-metadata": [
		{ title: "EXIF Viewer", href: "/image/exif" },
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/to-pdf": [
		{ title: "Merge PDF", href: "/pdf/merge" },
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/remove-background": [
		{ title: "Image Crop", href: "/image/crop" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Image Resize", href: "/image/resize" },
	],
	"/image/watermark": [
		{ title: "Image Resize", href: "/image/resize" },
		{ title: "Image Compress", href: "/image/compress" },
		{ title: "PDF Watermark", href: "/pdf/watermark" },
	],
	"/image/filters": [
		{ title: "Image Crop", href: "/image/crop" },
		{ title: "Image Resize", href: "/image/resize" },
		{ title: "Image Rotate", href: "/image/rotate" },
	],
	"/image/color-palette": [
		{ title: "Color Picker", href: "/developer/color-picker" },
		{ title: "Image Filters", href: "/image/filters" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/favicon-generator": [
		{ title: "SVG to PNG", href: "/image/svg-to-png" },
		{ title: "Image Resize", href: "/image/resize" },
		{ title: "ICO to PNG", href: "/image/ico-to-png" },
	],

	// ── Niche converters ──
	"/image/psd-converter": [
		{ title: "PSB Converter", href: "/image/psb-converter" },
		{ title: "XCF Converter", href: "/image/xcf-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/psb-converter": [
		{ title: "PSD Converter", href: "/image/psd-converter" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Image Compress", href: "/image/compress" },
	],
	"/image/raw-converter": [
		{ title: "HEIC to JPG", href: "/image/heic-to-jpg" },
		{ title: "TIFF to JPG", href: "/image/tiff-to-jpg" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/dcm-converter": [
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "FITS Converter", href: "/image/fits-converter" },
		{ title: "Image to PDF", href: "/image/to-pdf" },
	],
	"/image/dds-converter": [
		{ title: "TGA Converter", href: "/image/tga-converter" },
		{ title: "HDR Converter", href: "/image/hdr-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/tga-converter": [
		{ title: "DDS Converter", href: "/image/dds-converter" },
		{ title: "PCX Converter", href: "/image/pcx-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/hdr-converter": [
		{ title: "EXR Converter", href: "/image/exr-converter" },
		{ title: "DDS Converter", href: "/image/dds-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/exr-converter": [
		{ title: "HDR Converter", href: "/image/hdr-converter" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Image Compress", href: "/image/compress" },
	],
	"/image/fits-converter": [
		{ title: "DCM Converter", href: "/image/dcm-converter" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Image to PDF", href: "/image/to-pdf" },
	],
	"/image/pcx-converter": [
		{ title: "TGA Converter", href: "/image/tga-converter" },
		{ title: "Legacy Converter", href: "/image/legacy-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/netpbm-converter": [
		{ title: "Legacy Converter", href: "/image/legacy-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/jp2-converter": [
		{ title: "JXL to JPG", href: "/image/jxl-to-jpg" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/icns-converter": [
		{ title: "ICO to PNG", href: "/image/ico-to-png" },
		{ title: "Favicon Generator", href: "/image/favicon-generator" },
	],
	"/image/eps-converter": [
		{ title: "AI Converter", href: "/image/ai-converter" },
		{ title: "SVG to PNG", href: "/image/svg-to-png" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/ai-converter": [
		{ title: "EPS Converter", href: "/image/eps-converter" },
		{ title: "SVG to PNG", href: "/image/svg-to-png" },
		{ title: "PSD Converter", href: "/image/psd-converter" },
	],
	"/image/legacy-converter": [
		{ title: "PCX Converter", href: "/image/pcx-converter" },
		{ title: "Netpbm Converter", href: "/image/netpbm-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/svgz-converter": [
		{ title: "SVG Optimizer", href: "/vector/svg-optimizer" },
		{ title: "SVG to PNG", href: "/image/svg-to-png" },
	],
	"/image/xps-converter": [
		{ title: "PDF to JPG", href: "/pdf/pdf-to-jpg" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/odg-converter": [
		{ title: "VSD Converter", href: "/image/vsd-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/xcf-converter": [
		{ title: "PSD Converter", href: "/image/psd-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/xwindow-converter": [
		{ title: "Legacy Converter", href: "/image/legacy-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/cdr-converter": [
		{ title: "AI Converter", href: "/image/ai-converter" },
		{ title: "EPS Converter", href: "/image/eps-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/vsd-converter": [
		{ title: "ODG Converter", href: "/image/odg-converter" },
		{ title: "XPS Converter", href: "/image/xps-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],
	"/image/pub-converter": [
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "Image to PDF", href: "/image/to-pdf" },
	],
	"/image/emf-converter": [
		{ title: "VSD Converter", href: "/image/vsd-converter" },
		{ title: "Image Convert", href: "/image/convert" },
	],

	// ── PDF tools ──
	"/pdf/merge": [
		{ title: "Split PDF", href: "/pdf/split" },
		{ title: "Reorder PDF", href: "/pdf/reorder" },
		{ title: "Compress PDF", href: "/pdf/compress" },
		{ title: "Add Page Numbers", href: "/pdf/page-numbers" },
	],
	"/pdf/split": [
		{ title: "Merge PDF", href: "/pdf/merge" },
		{ title: "Reorder PDF", href: "/pdf/reorder" },
		{ title: "PDF to JPG", href: "/pdf/pdf-to-jpg" },
	],
	"/pdf/compress": [
		{ title: "Merge PDF", href: "/pdf/merge" },
		{ title: "PDF to JPG", href: "/pdf/pdf-to-jpg" },
		{ title: "Image Compress", href: "/image/compress" },
	],
	"/pdf/rotate": [
		{ title: "Reorder PDF", href: "/pdf/reorder" },
		{ title: "Merge PDF", href: "/pdf/merge" },
		{ title: "Split PDF", href: "/pdf/split" },
	],
	"/pdf/pdf-to-jpg": [
		{ title: "PDF to PNG", href: "/pdf/pdf-to-png" },
		{ title: "PDF to Text", href: "/pdf/pdf-to-text" },
		{ title: "Compress PDF", href: "/pdf/compress" },
		{ title: "Image to PDF", href: "/image/to-pdf" },
	],
	"/pdf/pdf-to-png": [
		{ title: "PDF to JPG", href: "/pdf/pdf-to-jpg" },
		{ title: "PDF to Text", href: "/pdf/pdf-to-text" },
		{ title: "Compress PDF", href: "/pdf/compress" },
	],
	"/pdf/pdf-to-text": [
		{ title: "PDF to JPG", href: "/pdf/pdf-to-jpg" },
		{ title: "PDF to PNG", href: "/pdf/pdf-to-png" },
		{ title: "Word Counter", href: "/developer/word-counter" },
	],
	"/pdf/watermark": [
		{ title: "Image Watermark", href: "/image/watermark" },
		{ title: "Protect PDF", href: "/pdf/protect" },
		{ title: "Add Page Numbers", href: "/pdf/page-numbers" },
	],
	"/pdf/reorder": [
		{ title: "Split PDF", href: "/pdf/split" },
		{ title: "Merge PDF", href: "/pdf/merge" },
		{ title: "Rotate PDF", href: "/pdf/rotate" },
	],
	"/pdf/page-numbers": [
		{ title: "Merge PDF", href: "/pdf/merge" },
		{ title: "PDF Watermark", href: "/pdf/watermark" },
		{ title: "Reorder PDF", href: "/pdf/reorder" },
	],
	"/pdf/protect": [
		{ title: "Unlock PDF", href: "/pdf/unlock" },
		{ title: "PDF Watermark", href: "/pdf/watermark" },
		{ title: "Compress PDF", href: "/pdf/compress" },
	],
	"/pdf/unlock": [
		{ title: "Protect PDF", href: "/pdf/protect" },
		{ title: "Merge PDF", href: "/pdf/merge" },
		{ title: "PDF to Text", href: "/pdf/pdf-to-text" },
	],

	// ── Developer tools ──
	"/developer/json-formatter": [
		{ title: "YAML ↔ JSON", href: "/developer/yaml-json" },
		{ title: "JSON ↔ CSV", href: "/developer/json-csv" },
		{ title: "JWT Decoder", href: "/developer/jwt-decoder" },
	],
	"/developer/color-picker": [
		{ title: "Color Palette", href: "/image/color-palette" },
		{ title: "CSS Formatter", href: "/developer/css-formatter" },
		{ title: "Hash Generator", href: "/developer/hash-generator" },
	],
	"/developer/base64-image": [
		{ title: "QR Code Generator", href: "/developer/qr-code" },
		{ title: "Image Convert", href: "/image/convert" },
		{ title: "URL Encoder", href: "/developer/url-encoder" },
	],
	"/developer/qr-code": [
		{ title: "Base64 Image", href: "/developer/base64-image" },
		{ title: "Hash Generator", href: "/developer/hash-generator" },
		{ title: "UUID Generator", href: "/developer/uuid-generator" },
	],
	"/developer/hash-generator": [
		{ title: "UUID Generator", href: "/developer/uuid-generator" },
		{ title: "Base64 Image", href: "/developer/base64-image" },
		{ title: "JWT Decoder", href: "/developer/jwt-decoder" },
	],
	"/developer/jwt-decoder": [
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
		{ title: "Hash Generator", href: "/developer/hash-generator" },
		{ title: "Base64 Image", href: "/developer/base64-image" },
	],
	"/developer/uuid-generator": [
		{ title: "Hash Generator", href: "/developer/hash-generator" },
		{ title: "Timestamp Converter", href: "/developer/timestamp-converter" },
		{ title: "Lorem Ipsum", href: "/developer/lorem-ipsum" },
	],
	"/developer/markdown-preview": [
		{ title: "Text Diff", href: "/developer/text-diff" },
		{ title: "Word Counter", href: "/developer/word-counter" },
		{ title: "CSS Formatter", href: "/developer/css-formatter" },
	],
	"/developer/regex-tester": [
		{ title: "Text Diff", href: "/developer/text-diff" },
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
		{ title: "Case Converter", href: "/developer/case-converter" },
	],
	"/developer/timestamp-converter": [
		{ title: "Cron Parser", href: "/developer/cron-parser" },
		{ title: "UUID Generator", href: "/developer/uuid-generator" },
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
	],
	"/developer/url-encoder": [
		{ title: "Base64 Image", href: "/developer/base64-image" },
		{ title: "Hash Generator", href: "/developer/hash-generator" },
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
	],
	"/developer/text-diff": [
		{ title: "Word Counter", href: "/developer/word-counter" },
		{ title: "Markdown Preview", href: "/developer/markdown-preview" },
		{ title: "Case Converter", href: "/developer/case-converter" },
	],
	"/developer/word-counter": [
		{ title: "Text Diff", href: "/developer/text-diff" },
		{ title: "Lorem Ipsum", href: "/developer/lorem-ipsum" },
		{ title: "Case Converter", href: "/developer/case-converter" },
	],
	"/developer/css-formatter": [
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
		{ title: "Color Picker", href: "/developer/color-picker" },
		{ title: "Markdown Preview", href: "/developer/markdown-preview" },
	],
	"/developer/case-converter": [
		{ title: "Word Counter", href: "/developer/word-counter" },
		{ title: "Text Diff", href: "/developer/text-diff" },
		{ title: "Regex Tester", href: "/developer/regex-tester" },
	],
	"/developer/cron-parser": [
		{ title: "Timestamp Converter", href: "/developer/timestamp-converter" },
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
		{ title: "Regex Tester", href: "/developer/regex-tester" },
	],
	"/developer/yaml-json": [
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
		{ title: "JSON ↔ CSV", href: "/developer/json-csv" },
		{ title: "CSS Formatter", href: "/developer/css-formatter" },
	],
	"/developer/json-csv": [
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
		{ title: "YAML ↔ JSON", href: "/developer/yaml-json" },
		{ title: "Word Counter", href: "/developer/word-counter" },
	],
	"/developer/lorem-ipsum": [
		{ title: "Word Counter", href: "/developer/word-counter" },
		{ title: "Text Diff", href: "/developer/text-diff" },
		{ title: "Markdown Preview", href: "/developer/markdown-preview" },
	],
	"/developer/sql-formatter": [
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
		{ title: "CSS Formatter", href: "/developer/css-formatter" },
		{ title: "JSON ↔ CSV", href: "/developer/json-csv" },
	],
	"/developer/html-formatter": [
		{ title: "CSS Formatter", href: "/developer/css-formatter" },
		{ title: "JavaScript Formatter", href: "/developer/js-formatter" },
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
	],
	"/developer/js-formatter": [
		{ title: "HTML Formatter", href: "/developer/html-formatter" },
		{ title: "CSS Formatter", href: "/developer/css-formatter" },
		{ title: "JSON Formatter", href: "/developer/json-formatter" },
	],

	// ── Vector tools ──
	"/vector/svg-optimizer": [
		{ title: "SVG to PNG", href: "/image/svg-to-png" },
		{ title: "SVG to JPG", href: "/image/svg-to-jpg" },
		{ title: "SVGZ Converter", href: "/image/svgz-converter" },
	],
};
