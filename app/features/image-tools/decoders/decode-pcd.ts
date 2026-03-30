import type { DecodedImage } from "./types";

/**
 * Decode a Kodak Photo CD (PCD) file to raw RGBA pixels.
 *
 * Custom parser — no external library. Decodes the Base resolution
 * (768x512) or falls back to Base/4 (384x256) for smaller files.
 *
 * - Y (luma) plane: full resolution
 * - Cb, Cr planes: half resolution, upsampled 2x with nearest-neighbor
 * - YCbCr → RGB color conversion with clamping
 */
export async function decodePcd(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);

	// Determine which resolution is available
	// Base resolution (768x512): Y starts at 0x30000 (196608)
	// Base/4 resolution (384x256): Y starts at 0xB800 (47104)
	const BASE_OFFSET = 0x30000;
	const BASE_WIDTH = 768;
	const BASE_HEIGHT = 512;
	const BASE4_OFFSET = 0xb800;
	const BASE4_WIDTH = 384;
	const BASE4_HEIGHT = 256;

	let yOffset: number;
	let width: number;
	let height: number;
	let chromaWidth: number;
	let chromaHeight: number;

	const baseYSize = BASE_WIDTH * BASE_HEIGHT;
	const baseChromaSize = (BASE_WIDTH / 2) * (BASE_HEIGHT / 2);
	const baseTotalNeeded = BASE_OFFSET + baseYSize + 2 * baseChromaSize;

	const base4YSize = BASE4_WIDTH * BASE4_HEIGHT;
	const base4ChromaSize = (BASE4_WIDTH / 2) * (BASE4_HEIGHT / 2);
	const base4TotalNeeded = BASE4_OFFSET + base4YSize + 2 * base4ChromaSize;

	if (bytes.length >= baseTotalNeeded) {
		// Use Base resolution
		yOffset = BASE_OFFSET;
		width = BASE_WIDTH;
		height = BASE_HEIGHT;
		chromaWidth = BASE_WIDTH / 2;
		chromaHeight = BASE_HEIGHT / 2;
	} else if (bytes.length >= base4TotalNeeded) {
		// Fall back to Base/4 resolution
		yOffset = BASE4_OFFSET;
		width = BASE4_WIDTH;
		height = BASE4_HEIGHT;
		chromaWidth = BASE4_WIDTH / 2;
		chromaHeight = BASE4_HEIGHT / 2;
	} else {
		throw new Error(
			"This PCD file could not be decoded. The file is too small to contain any supported resolution.",
		);
	}

	const ySize = width * height;
	const chromaSize = chromaWidth * chromaHeight;

	// Extract planes
	const yPlane = bytes.slice(yOffset, yOffset + ySize);
	const cbPlane = bytes.slice(yOffset + ySize, yOffset + ySize + chromaSize);
	const crPlane = bytes.slice(
		yOffset + ySize + chromaSize,
		yOffset + ySize + 2 * chromaSize,
	);

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Convert YCbCr → RGBA with chroma upsampling (nearest-neighbor 2x)
	const rgba = new Uint8Array(width * height * 4);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const yIdx = y * width + x;
			const chromaY = Math.floor(y / 2);
			const chromaX = Math.floor(x / 2);
			const chromaIdx = chromaY * chromaWidth + chromaX;

			const yVal = yPlane[yIdx];
			const cb = cbPlane[chromaIdx];
			const cr = crPlane[chromaIdx];

			// YCbCr → RGB
			const r = yVal + 1.402 * (cr - 128);
			const g = yVal - 0.34414 * (cb - 128) - 0.71414 * (cr - 128);
			const b = yVal + 1.772 * (cb - 128);

			const dst = (y * width + x) * 4;
			rgba[dst] = clamp(r);
			rgba[dst + 1] = clamp(g);
			rgba[dst + 2] = clamp(b);
			rgba[dst + 3] = 255;
		}
	}

	return { data: rgba, width, height };
}

/** Clamp a value to the 0-255 range. */
function clamp(value: number): number {
	return Math.max(0, Math.min(255, Math.round(value)));
}
