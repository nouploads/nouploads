/**
 * MIME type accept presets for ToolDropzone.
 *
 * Usage:
 *   <ToolDropzone accept={ACCEPT_HEIC} ... />
 *   <ToolDropzone accept={ACCEPT_IMAGES} ... />
 *
 * Add new presets here as tools are added.
 */

export const ACCEPT_HEIC: Record<string, string[]> = {
	"image/heic": [".heic"],
};

export const ACCEPT_IMAGES: Record<string, string[]> = {
	"image/png": [".png"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/webp": [".webp"],
	"image/avif": [".avif"],
	"image/gif": [".gif"],
	"image/bmp": [".bmp"],
	"image/tiff": [".tiff", ".tif"],
	"image/svg+xml": [".svg"],
	"image/heic": [".heic"],
};

export const ACCEPT_IMAGES_RASTER: Record<string, string[]> = {
	"image/png": [".png"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/webp": [".webp"],
	"image/avif": [".avif"],
	"image/gif": [".gif"],
	"image/bmp": [".bmp"],
	"image/tiff": [".tiff", ".tif"],
};

export const ACCEPT_COMPRESSIBLE: Record<string, string[]> = {
	"image/png": [".png"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/webp": [".webp"],
	"image/avif": [".avif"],
	"image/gif": [".gif"],
};

export const ACCEPT_PDF: Record<string, string[]> = {
	"application/pdf": [".pdf"],
};

/**
 * All image formats accepted by the universal converter,
 * including niche/exotic formats with custom decoders.
 *
 * For formats where browsers don't set a MIME type, we use
 * an empty-string key so the file picker filters by extension.
 * The actual format detection happens via `inferMime()` in the processor.
 */
export const ACCEPT_IMAGES_ALL: Record<string, string[]> = {
	...ACCEPT_IMAGES,
	"image/jxl": [".jxl"],
	"image/x-icon": [".ico", ".cur"],
	"image/vnd.adobe.photoshop": [".psd"],
	"image/vnd.adobe.photoshop-large": [".psb"],
	"image/jp2": [".jp2", ".j2k", ".jpf", ".jpx"],
	"image/x-exr": [".exr"],
	"image/vnd.radiance": [".hdr"],
	"image/x-tga": [".tga"],
	"image/vnd-ms.dds": [".dds"],
	"image/x-pcx": [".pcx"],
	"image/x-xcf": [".xcf"],
	"application/dicom": [".dcm"],
	"image/fits": [".fits", ".fts", ".fit"],
	// Netpbm family
	"image/x-portable-bitmap": [".pbm"],
	"image/x-portable-graymap": [".pgm"],
	"image/x-portable-pixmap": [".ppm"],
	"image/x-portable-anymap": [".pnm"],
	"image/x-portable-arbitrarymap": [".pam"],
	"image/x-portable-floatmap": [".pfm"],
	"image/x-icns": [".icns"],
	"application/postscript": [".eps", ".ps"],
	"image/x-sgi": [".sgi", ".rgb", ".bw"],
	"image/x-sun-raster": [".ras"],
	"image/vnd.wap.wbmp": [".wbmp"],
	"image/x-sfw": [".sfw"],
	"image/x-photo-cd": [".pcd"],
	"image/x-pict": [".pict", ".pct"],
	"application/illustrator": [".ai"],
	"image/svg+xml-compressed": [".svgz"],
	"image/x-xbitmap": [".xbm"],
	"image/x-xpixmap": [".xpm"],
	"image/x-xwindowdump": [".xwd"],
	"application/vnd.ms-xpsdocument": [".xps"],
	"application/oxps": [".oxps"],
	"application/vnd.oasis.opendocument.graphics": [".odg"],
	"application/vnd.corel-draw": [".cdr"],
	"application/vnd.visio": [".vsd"],
	"application/vnd.ms-visio.drawing.main+xml": [".vsdx"],
	"application/x-mspublisher": [".pub"],
	// Camera RAW — browsers set no MIME for these, so use empty key
	"": [
		".cr2",
		".cr3",
		".crw",
		".nef",
		".nrw",
		".arw",
		".sr2",
		".srw",
		".dng",
		".raf",
		".orf",
		".pef",
		".erf",
		".rw2",
		".mrw",
		".mef",
		".mos",
		".kdc",
		".dcr",
		".x3f",
		".3fr",
		".raw",
	],
};
