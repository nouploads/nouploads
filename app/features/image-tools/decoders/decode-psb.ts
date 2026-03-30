import type { DecodedImage } from "./types";

const MAX_PSB_DIMENSION = 8192;

/**
 * Decode a PSB (Photoshop Large Document) file to raw RGBA pixels using @webtoon/psd.
 * PSB is version 2 of the PSD format and supports canvases up to 300,000 x 300,000 px.
 * The library handles both PSD (version 1) and PSB (version 2) transparently.
 *
 * Composites all visible layers into a single flattened image.
 * Handles CMYK, 16-bit, and multi-layer documents.
 *
 * Safety: warns if dimensions exceed 8192x8192 (likely to exhaust browser memory).
 */
export async function decodePsb(
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
			"This PSB file could not be decoded. It may be corrupted or use an unsupported variant.",
		);
	}

	const { width, height } = psd;

	if (!width || !height) {
		throw new Error(
			"This PSB file could not be decoded. It may be corrupted or use an unsupported variant.",
		);
	}

	if (width > MAX_PSB_DIMENSION || height > MAX_PSB_DIMENSION) {
		throw new Error(
			`This PSB file is ${width}\u00D7${height} pixels, which exceeds the safe browser limit of ${MAX_PSB_DIMENSION}\u00D7${MAX_PSB_DIMENSION}. Decoding would likely crash the tab due to memory exhaustion.`,
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let rgba: Uint8ClampedArray;
	try {
		rgba = await psd.composite();
	} catch {
		throw new Error(
			"This PSB file could not be composited. It may use unsupported layer effects or blending modes.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	return {
		data: new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength),
		width,
		height,
	};
}
