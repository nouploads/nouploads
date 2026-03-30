import type { ImageData } from "../backend.js";

/**
 * Decode a PSD (Adobe Photoshop) file to raw RGBA pixels using @webtoon/psd.
 * Composites all visible layers into a single flattened image.
 * Handles CMYK, 16-bit, and multi-layer documents.
 */
export async function decodePsd(input: Uint8Array): Promise<ImageData> {
	const { default: Psd } = await import("@webtoon/psd");

	const buffer = input.buffer.slice(
		input.byteOffset,
		input.byteOffset + input.byteLength,
	);

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

	let rgba: Uint8ClampedArray;
	try {
		rgba = await psd.composite();
	} catch {
		throw new Error(
			"This PSD file could not be composited. It may use unsupported layer effects or blending modes.",
		);
	}

	return {
		data: new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength),
		width,
		height,
	};
}
