import type { DecodedImage } from "./types";

/**
 * Decode a PSD (Adobe Photoshop) file to raw RGBA pixels using @webtoon/psd.
 * Composites all visible layers into a single flattened image.
 * Handles CMYK, 16-bit, and multi-layer documents.
 */
export async function decodePsd(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const { default: Psd } = await import("@webtoon/psd");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let psd: InstanceType<typeof Psd>;
	try {
		psd = Psd.parse(buffer);
	} catch {
		throw new Error(
			"This PSD file could not be decoded. It may be corrupted or use an unsupported variant.",
		);
	}

	const { width, height } = psd;

	if (!width || !height) {
		throw new Error(
			"This PSD file could not be decoded. It may be corrupted or use an unsupported variant.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let rgba: Uint8ClampedArray;
	try {
		rgba = await psd.composite();
	} catch {
		throw new Error(
			"This PSD file could not be composited. It may use unsupported layer effects or blending modes.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	return {
		data: new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength),
		width,
		height,
	};
}
