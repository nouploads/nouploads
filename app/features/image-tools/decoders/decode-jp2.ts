import type { DecodedImage } from "./types";

/**
 * JP2 box-format signature: 12 bytes
 * 0x0000000C 6A502020 0D0A870A
 */
const JP2_SIGNATURE = [
	0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a,
] as const;

/** J2K raw codestream magic: FF 4F FF 51 */
const J2K_MAGIC = [0xff, 0x4f, 0xff, 0x51] as const;

const MAX_DIMENSION = 16384;

/**
 * Check if bytes start with the JP2 box-format signature.
 */
function isJp2Box(bytes: Uint8Array): boolean {
	if (bytes.length < JP2_SIGNATURE.length) return false;
	for (let i = 0; i < JP2_SIGNATURE.length; i++) {
		if (bytes[i] !== JP2_SIGNATURE[i]) return false;
	}
	return true;
}

/**
 * Check if bytes start with a J2K raw codestream.
 */
function isJ2kCodestream(bytes: Uint8Array): boolean {
	if (bytes.length < J2K_MAGIC.length) return false;
	for (let i = 0; i < J2K_MAGIC.length; i++) {
		if (bytes[i] !== J2K_MAGIC[i]) return false;
	}
	return true;
}

/**
 * Decode a JPEG 2000 (.jp2, .j2k, .jpf, .jpx) file to raw RGBA pixels
 * using the OpenJPEG WASM codec from @cornerstonejs/codec-openjpeg.
 *
 * Supports:
 * - JP2 box format (ISO 15444-1 container)
 * - J2K raw codestream
 * - 8-bit and 16-bit samples
 * - 1 (grayscale), 3 (RGB), and 4 (RGBA) component images
 */
export async function decodeJp2(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);

	/* ---- 1. Validate magic bytes ---- */
	if (!isJp2Box(bytes) && !isJ2kCodestream(bytes)) {
		throw new Error(
			"This file could not be decoded as JPEG 2000. It does not have valid JP2 or J2K magic bytes.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	/* ---- 2. Load OpenJPEG WASM decoder ---- */
	// Use the JS-only (asm.js) decode build so no external .wasm file is needed.
	// The module is ~540KB and only loads when a JP2 file is actually dropped.
	const OpenJPEGJS = (await import("@cornerstonejs/codec-openjpeg/decode"))
		.default;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const openjpeg = await OpenJPEGJS();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	/* ---- 3. Decode ---- */
	const decoder = new openjpeg.J2KDecoder();
	const encodedBuffer = decoder.getEncodedBuffer(bytes.length);
	encodedBuffer.set(bytes);

	try {
		decoder.decode();
	} catch {
		throw new Error(
			"This JPEG 2000 file could not be decoded. The codestream may be corrupted or use an unsupported profile.",
		);
	}

	const frameInfo = decoder.getFrameInfo();
	const { width, height, bitsPerSample, componentCount, isSigned } = frameInfo;

	if (width <= 0 || height <= 0) {
		throw new Error(
			"This JPEG 2000 file could not be decoded. The image has invalid dimensions.",
		);
	}

	if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
		throw new Error(
			`This JPEG 2000 file could not be decoded. Image dimensions ${width}×${height} exceed the ${MAX_DIMENSION}px limit.`,
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	/* ---- 4. Extract pixel data ---- */
	const decodedBuffer = decoder.getDecodedBuffer();
	const rawPixels = new Uint8Array(
		decodedBuffer.buffer,
		decodedBuffer.byteOffset,
		decodedBuffer.byteLength,
	);

	/* ---- 5. Convert to RGBA ---- */
	const totalPixels = width * height;
	const rgba = new Uint8Array(totalPixels * 4);

	// Determine scaling for higher bit depths (e.g. 12-bit or 16-bit samples)
	const bytesPerSample = bitsPerSample <= 8 ? 1 : 2;
	const maxVal = (1 << bitsPerSample) - 1;

	if (componentCount === 1) {
		// Grayscale → replicate to RGB, A=255
		for (let i = 0; i < totalPixels; i++) {
			let gray: number;
			if (bytesPerSample === 1) {
				gray = rawPixels[i];
			} else {
				// 16-bit LE
				const off = i * 2;
				gray = rawPixels[off] | (rawPixels[off + 1] << 8);
			}

			if (isSigned) {
				// Signed samples: shift to unsigned range
				gray = gray + (maxVal + 1) / 2;
			}

			// Normalize to 0-255
			const val =
				bitsPerSample === 8
					? gray
					: Math.round((Math.max(0, Math.min(maxVal, gray)) / maxVal) * 255);

			const dstOff = i * 4;
			rgba[dstOff] = val;
			rgba[dstOff + 1] = val;
			rgba[dstOff + 2] = val;
			rgba[dstOff + 3] = 255;
		}
	} else if (componentCount === 3) {
		// RGB → add A=255
		for (let i = 0; i < totalPixels; i++) {
			const srcOff = i * 3 * bytesPerSample;
			const dstOff = i * 4;

			for (let c = 0; c < 3; c++) {
				let val: number;
				if (bytesPerSample === 1) {
					val = rawPixels[srcOff + c];
				} else {
					const off = srcOff + c * 2;
					val = rawPixels[off] | (rawPixels[off + 1] << 8);
				}
				if (bitsPerSample !== 8) {
					val = Math.round((Math.max(0, Math.min(maxVal, val)) / maxVal) * 255);
				}
				rgba[dstOff + c] = val;
			}
			rgba[dstOff + 3] = 255;
		}
	} else if (componentCount === 4) {
		// RGBA
		for (let i = 0; i < totalPixels; i++) {
			const srcOff = i * 4 * bytesPerSample;
			const dstOff = i * 4;

			for (let c = 0; c < 4; c++) {
				let val: number;
				if (bytesPerSample === 1) {
					val = rawPixels[srcOff + c];
				} else {
					const off = srcOff + c * 2;
					val = rawPixels[off] | (rawPixels[off + 1] << 8);
				}
				if (bitsPerSample !== 8) {
					val = Math.round((Math.max(0, Math.min(maxVal, val)) / maxVal) * 255);
				}
				rgba[dstOff + c] = val;
			}
		}
	} else {
		throw new Error(
			`This JPEG 2000 file has ${componentCount} color components, which is not supported. Expected 1 (grayscale), 3 (RGB), or 4 (RGBA).`,
		);
	}

	return { data: rgba, width, height };
}
