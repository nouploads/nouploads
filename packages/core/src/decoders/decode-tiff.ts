import type { ImageData } from "../backend.js";

/**
 * Decode a TIFF/TIF file to raw RGBA pixels using utif2.
 * Handles CMYK, 16-bit, LZW/ZIP/JPEG compression, multi-page (first page only).
 */
export async function decodeTiff(input: Uint8Array): Promise<ImageData> {
	const UTIF = await import("utif2");

	const buffer = input.buffer.slice(
		input.byteOffset,
		input.byteOffset + input.byteLength,
	);

	const ifds = UTIF.decode(buffer);
	if (!ifds || ifds.length === 0) {
		throw new Error(
			"This TIFF file could not be decoded. It may be corrupted or use an unsupported variant.",
		);
	}

	// Decode the first page
	UTIF.decodeImage(buffer, ifds[0]);

	const ifd = ifds[0];
	const { width, height } = ifd;

	if (!width || !height || !ifd.data || ifd.data.length === 0) {
		throw new Error(
			"This TIFF file could not be decoded. It may be corrupted or use an unsupported variant.",
		);
	}

	// Convert decoded data (may be RGB, CMYK, etc.) to standard RGBA8
	const rgba = UTIF.toRGBA8(ifd);

	return {
		data: new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength),
		width,
		height,
	};
}
