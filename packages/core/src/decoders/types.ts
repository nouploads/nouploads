import type { ImageData } from "../backend.js";

/**
 * A decoder function that converts an exotic image format
 * into raw RGBA pixel data.
 *
 * Unlike the web app's Blob-based decoders, core decoders
 * accept Uint8Array directly for portability across Node/browser.
 */
export type DecoderFn = (input: Uint8Array) => Promise<ImageData>;
