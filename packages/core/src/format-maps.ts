/**
 * Shared format lookup tables for MIME types, extensions, and output format mapping.
 * Extracted from the web app's convert-image.ts EXTENSION_TO_MIME map.
 */

/** Map from output format shortname to MIME type */
export const FORMAT_TO_MIME: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
	avif: "image/avif",
	gif: "image/gif",
	tiff: "image/tiff",
	bmp: "image/bmp",
	svg: "image/svg+xml",
	ico: "image/x-icon",
	pdf: "application/pdf",
};

/** Map from output format shortname to file extension (with dot) */
export const FORMAT_TO_EXTENSION: Record<string, string> = {
	jpg: ".jpg",
	jpeg: ".jpg",
	png: ".png",
	webp: ".webp",
	avif: ".avif",
	gif: ".gif",
	tiff: ".tiff",
	bmp: ".bmp",
	svg: ".svg",
	ico: ".ico",
	pdf: ".pdf",
};

/** Input format definitions: MIME types and file extensions for each source format */
export const INPUT_FORMATS: Record<
	string,
	{ mimeTypes: string[]; extensions: string[] }
> = {
	jpg: {
		mimeTypes: ["image/jpeg"],
		extensions: [".jpg", ".jpeg"],
	},
	png: {
		mimeTypes: ["image/png"],
		extensions: [".png"],
	},
	webp: {
		mimeTypes: ["image/webp"],
		extensions: [".webp"],
	},
	avif: {
		mimeTypes: ["image/avif"],
		extensions: [".avif"],
	},
	gif: {
		mimeTypes: ["image/gif"],
		extensions: [".gif"],
	},
	bmp: {
		mimeTypes: ["image/bmp", "image/x-bmp", "image/x-ms-bmp"],
		extensions: [".bmp"],
	},
	tiff: {
		mimeTypes: ["image/tiff"],
		extensions: [".tiff", ".tif"],
	},
	svg: {
		mimeTypes: ["image/svg+xml"],
		extensions: [".svg"],
	},
	ico: {
		mimeTypes: ["image/x-icon", "image/vnd.microsoft.icon"],
		extensions: [".ico", ".cur"],
	},
	heic: {
		mimeTypes: ["image/heic", "image/heif"],
		extensions: [".heic", ".heif"],
	},
};
