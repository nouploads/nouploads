/**
 * Standard output from a pixel-level image decoder.
 *
 * Every non-browser-native format decoder returns this shape:
 * raw RGBA pixel data + dimensions. The convert pipeline then
 * sends these pixels to the existing OffscreenCanvas worker
 * for encoding to the desired output format.
 */
export interface DecodedImage {
	/** RGBA pixel data, 4 bytes per pixel, row-major top-to-bottom. */
	data: Uint8Array;
	width: number;
	height: number;
}

/**
 * A decoder function that converts an exotic image format
 * into raw RGBA pixel data the convert pipeline can use.
 */
export type DecoderFn = (
	input: Blob,
	signal?: AbortSignal,
) => Promise<DecodedImage>;
