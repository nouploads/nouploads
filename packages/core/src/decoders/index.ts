/**
 * Decoder registry: maps MIME types to lazy-loaded decoder functions.
 * Each decoder converts exotic format bytes to RGBA pixels.
 */

export { decodeDds } from "./decode-dds.js";
export { decodeExr } from "./decode-exr.js";
export { decodeFits } from "./decode-fits.js";
export { decodeHdr } from "./decode-hdr.js";
export { decodeIcns } from "./decode-icns.js";
export { decodeNetpbm } from "./decode-netpbm.js";
export { decodePcx } from "./decode-pcx.js";
export { decodePict } from "./decode-pict.js";
export { decodePsd } from "./decode-psd.js";
export { decodeRas } from "./decode-ras.js";
export { decodeSgi } from "./decode-sgi.js";
export { decodeTga } from "./decode-tga.js";
export { decodeTiff } from "./decode-tiff.js";
export { decodeWbmp } from "./decode-wbmp.js";
export { decodeXbm } from "./decode-xbm.js";
export { decodeXcf } from "./decode-xcf.js";
export { decodeXpm } from "./decode-xpm.js";
export { decodeXwd } from "./decode-xwd.js";
export type { DecoderFn } from "./types.js";
