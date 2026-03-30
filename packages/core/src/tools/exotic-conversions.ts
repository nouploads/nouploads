/**
 * Registers conversion tools for exotic image formats using custom JS decoders.
 * Each format gets a to-jpg and to-png tool via the exotic decoder factory.
 */

import { createExoticDecoderTool } from "./exotic-factory.js";

// --- TIFF ---
const tiffConfig = {
	inputMimeTypes: ["image/tiff"],
	inputExtensions: [".tiff", ".tif"],
};
createExoticDecoderTool({
	from: "tiff",
	to: "jpg",
	...tiffConfig,
	description: "Convert TIFF images to JPG using a built-in decoder.",
	decoder: () => import("../decoders/decode-tiff.js").then((m) => m.decodeTiff),
});
createExoticDecoderTool({
	from: "tiff",
	to: "png",
	...tiffConfig,
	description: "Convert TIFF images to PNG using a built-in decoder.",
	decoder: () => import("../decoders/decode-tiff.js").then((m) => m.decodeTiff),
});

// --- PSD ---
const psdConfig = {
	inputMimeTypes: ["image/vnd.adobe.photoshop"],
	inputExtensions: [".psd"],
};
createExoticDecoderTool({
	from: "psd",
	to: "jpg",
	...psdConfig,
	description: "Convert Photoshop PSD files to JPG.",
	decoder: () => import("../decoders/decode-psd.js").then((m) => m.decodePsd),
});
createExoticDecoderTool({
	from: "psd",
	to: "png",
	...psdConfig,
	description: "Convert Photoshop PSD files to PNG with transparency.",
	decoder: () => import("../decoders/decode-psd.js").then((m) => m.decodePsd),
});

// --- PSB ---
createExoticDecoderTool({
	from: "psb",
	to: "jpg",
	inputMimeTypes: ["image/vnd.adobe.photoshop-large"],
	inputExtensions: [".psb"],
	description: "Convert Photoshop PSB (large) files to JPG.",
	decoder: () => import("../decoders/decode-psd.js").then((m) => m.decodePsd),
});
createExoticDecoderTool({
	from: "psb",
	to: "png",
	inputMimeTypes: ["image/vnd.adobe.photoshop-large"],
	inputExtensions: [".psb"],
	description: "Convert Photoshop PSB (large) files to PNG.",
	decoder: () => import("../decoders/decode-psd.js").then((m) => m.decodePsd),
});

// --- HDR ---
const hdrConfig = {
	inputMimeTypes: ["image/vnd.radiance"],
	inputExtensions: [".hdr"],
};
createExoticDecoderTool({
	from: "hdr",
	to: "jpg",
	...hdrConfig,
	description: "Convert HDR (Radiance) images to JPG with tone mapping.",
	decoder: () => import("../decoders/decode-hdr.js").then((m) => m.decodeHdr),
});
createExoticDecoderTool({
	from: "hdr",
	to: "png",
	...hdrConfig,
	description: "Convert HDR (Radiance) images to PNG with tone mapping.",
	decoder: () => import("../decoders/decode-hdr.js").then((m) => m.decodeHdr),
});

// --- TGA ---
const tgaConfig = {
	inputMimeTypes: ["image/x-tga"],
	inputExtensions: [".tga"],
};
createExoticDecoderTool({
	from: "tga",
	to: "jpg",
	...tgaConfig,
	description: "Convert TGA images to JPG.",
	decoder: () => import("../decoders/decode-tga.js").then((m) => m.decodeTga),
});
createExoticDecoderTool({
	from: "tga",
	to: "png",
	...tgaConfig,
	description: "Convert TGA images to PNG with transparency.",
	decoder: () => import("../decoders/decode-tga.js").then((m) => m.decodeTga),
});

// --- EXR ---
const exrConfig = {
	inputMimeTypes: ["image/x-exr"],
	inputExtensions: [".exr"],
};
createExoticDecoderTool({
	from: "exr",
	to: "jpg",
	...exrConfig,
	description: "Convert OpenEXR images to JPG with tone mapping.",
	decoder: () => import("../decoders/decode-exr.js").then((m) => m.decodeExr),
});
createExoticDecoderTool({
	from: "exr",
	to: "png",
	...exrConfig,
	description: "Convert OpenEXR images to PNG with tone mapping.",
	decoder: () => import("../decoders/decode-exr.js").then((m) => m.decodeExr),
});

// --- DDS ---
const ddsConfig = {
	inputMimeTypes: ["image/vnd-ms.dds"],
	inputExtensions: [".dds"],
};
createExoticDecoderTool({
	from: "dds",
	to: "jpg",
	...ddsConfig,
	description: "Convert DirectDraw Surface (DDS) textures to JPG.",
	decoder: () => import("../decoders/decode-dds.js").then((m) => m.decodeDds),
});
createExoticDecoderTool({
	from: "dds",
	to: "png",
	...ddsConfig,
	description: "Convert DirectDraw Surface (DDS) textures to PNG.",
	decoder: () => import("../decoders/decode-dds.js").then((m) => m.decodeDds),
});

// --- PCX ---
const pcxConfig = {
	inputMimeTypes: ["image/x-pcx"],
	inputExtensions: [".pcx"],
};
createExoticDecoderTool({
	from: "pcx",
	to: "jpg",
	...pcxConfig,
	description: "Convert PCX images to JPG.",
	decoder: () => import("../decoders/decode-pcx.js").then((m) => m.decodePcx),
});
createExoticDecoderTool({
	from: "pcx",
	to: "png",
	...pcxConfig,
	description: "Convert PCX images to PNG.",
	decoder: () => import("../decoders/decode-pcx.js").then((m) => m.decodePcx),
});

// --- NetPBM ---
const netpbmConfig = {
	inputMimeTypes: [
		"image/x-portable-bitmap",
		"image/x-portable-graymap",
		"image/x-portable-pixmap",
		"image/x-portable-anymap",
		"image/x-portable-arbitrarymap",
		"image/x-portable-floatmap",
	],
	inputExtensions: [".pbm", ".pgm", ".ppm", ".pnm", ".pam", ".pfm"],
};
createExoticDecoderTool({
	from: "netpbm",
	to: "jpg",
	...netpbmConfig,
	description: "Convert NetPBM (PBM/PGM/PPM/PAM) images to JPG.",
	decoder: () =>
		import("../decoders/decode-netpbm.js").then((m) => m.decodeNetpbm),
});
createExoticDecoderTool({
	from: "netpbm",
	to: "png",
	...netpbmConfig,
	description: "Convert NetPBM (PBM/PGM/PPM/PAM) images to PNG.",
	decoder: () =>
		import("../decoders/decode-netpbm.js").then((m) => m.decodeNetpbm),
});

// --- SGI ---
const sgiConfig = {
	inputMimeTypes: ["image/x-sgi"],
	inputExtensions: [".sgi", ".rgb", ".bw"],
};
createExoticDecoderTool({
	from: "sgi",
	to: "jpg",
	...sgiConfig,
	description: "Convert SGI RGB images to JPG.",
	decoder: () => import("../decoders/decode-sgi.js").then((m) => m.decodeSgi),
});
createExoticDecoderTool({
	from: "sgi",
	to: "png",
	...sgiConfig,
	description: "Convert SGI RGB images to PNG.",
	decoder: () => import("../decoders/decode-sgi.js").then((m) => m.decodeSgi),
});

// --- Sun Raster ---
const rasConfig = {
	inputMimeTypes: ["image/x-sun-raster"],
	inputExtensions: [".ras"],
};
createExoticDecoderTool({
	from: "ras",
	to: "jpg",
	...rasConfig,
	description: "Convert Sun Raster images to JPG.",
	decoder: () => import("../decoders/decode-ras.js").then((m) => m.decodeRas),
});
createExoticDecoderTool({
	from: "ras",
	to: "png",
	...rasConfig,
	description: "Convert Sun Raster images to PNG.",
	decoder: () => import("../decoders/decode-ras.js").then((m) => m.decodeRas),
});

// --- WBMP ---
const wbmpConfig = {
	inputMimeTypes: ["image/vnd.wap.wbmp"],
	inputExtensions: [".wbmp"],
};
createExoticDecoderTool({
	from: "wbmp",
	to: "png",
	...wbmpConfig,
	description: "Convert Wireless Bitmap (WBMP) images to PNG.",
	decoder: () => import("../decoders/decode-wbmp.js").then((m) => m.decodeWbmp),
});

// --- XBM ---
const xbmConfig = {
	inputMimeTypes: ["image/x-xbitmap"],
	inputExtensions: [".xbm"],
};
createExoticDecoderTool({
	from: "xbm",
	to: "png",
	...xbmConfig,
	description: "Convert X Bitmap (XBM) images to PNG.",
	decoder: () => import("../decoders/decode-xbm.js").then((m) => m.decodeXbm),
});

// --- XPM ---
const xpmConfig = {
	inputMimeTypes: ["image/x-xpixmap"],
	inputExtensions: [".xpm"],
};
createExoticDecoderTool({
	from: "xpm",
	to: "png",
	...xpmConfig,
	description: "Convert X Pixmap (XPM) images to PNG.",
	decoder: () => import("../decoders/decode-xpm.js").then((m) => m.decodeXpm),
});

// --- XWD ---
const xwdConfig = {
	inputMimeTypes: ["image/x-xwindowdump"],
	inputExtensions: [".xwd"],
};
createExoticDecoderTool({
	from: "xwd",
	to: "png",
	...xwdConfig,
	description: "Convert X Window Dump (XWD) images to PNG.",
	decoder: () => import("../decoders/decode-xwd.js").then((m) => m.decodeXwd),
});

// --- FITS ---
const fitsConfig = {
	inputMimeTypes: ["image/fits"],
	inputExtensions: [".fits", ".fts", ".fit"],
};
createExoticDecoderTool({
	from: "fits",
	to: "jpg",
	...fitsConfig,
	description: "Convert FITS astronomy images to JPG.",
	decoder: () => import("../decoders/decode-fits.js").then((m) => m.decodeFits),
});
createExoticDecoderTool({
	from: "fits",
	to: "png",
	...fitsConfig,
	description: "Convert FITS astronomy images to PNG.",
	decoder: () => import("../decoders/decode-fits.js").then((m) => m.decodeFits),
});

// --- XCF (GIMP) ---
const xcfConfig = {
	inputMimeTypes: ["image/x-xcf"],
	inputExtensions: [".xcf"],
};
createExoticDecoderTool({
	from: "xcf",
	to: "jpg",
	...xcfConfig,
	description: "Convert GIMP XCF files to JPG.",
	decoder: () => import("../decoders/decode-xcf.js").then((m) => m.decodeXcf),
});
createExoticDecoderTool({
	from: "xcf",
	to: "png",
	...xcfConfig,
	description: "Convert GIMP XCF files to PNG with transparency.",
	decoder: () => import("../decoders/decode-xcf.js").then((m) => m.decodeXcf),
});

// --- ICNS ---
const icnsConfig = {
	inputMimeTypes: ["image/x-icns"],
	inputExtensions: [".icns"],
};
createExoticDecoderTool({
	from: "icns",
	to: "png",
	...icnsConfig,
	description: "Convert Apple ICNS icon files to PNG.",
	decoder: () => import("../decoders/decode-icns.js").then((m) => m.decodeIcns),
});

// --- PICT ---
const pictConfig = {
	inputMimeTypes: ["image/x-pict"],
	inputExtensions: [".pict", ".pct"],
};
createExoticDecoderTool({
	from: "pict",
	to: "png",
	...pictConfig,
	description: "Convert Apple PICT images to PNG.",
	decoder: () => import("../decoders/decode-pict.js").then((m) => m.decodePict),
});
