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
  "image/heic": [".heic", ".HEIC"],
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

export const ACCEPT_PDF: Record<string, string[]> = {
  "application/pdf": [".pdf"],
};
