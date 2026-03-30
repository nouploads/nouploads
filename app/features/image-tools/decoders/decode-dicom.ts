import type { DecodedImage } from "./types";

/**
 * Decode a DICOM (.dcm) medical image file to raw RGBA pixels using daikon.
 *
 * Supports:
 * - Standard DICOM Part 10 files (128-byte preamble + "DICM" magic)
 * - 8-bit and 16-bit grayscale (MONOCHROME1/MONOCHROME2)
 * - Window/level (contrast) from DICOM tags, with auto fallback
 * - Slope/intercept rescale transform
 *
 * Non-image DICOM files (structured reports, waveforms) are rejected.
 */
export async function decodeDicom(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	/* ---- 1. Validate DICOM magic ---- */
	if (buffer.byteLength < 132) {
		throw new Error(
			"This DICOM file could not be decoded. The file is too small to contain a valid DICOM header.",
		);
	}

	const magic = new Uint8Array(buffer, 128, 4);
	if (
		magic[0] !== 0x44 ||
		magic[1] !== 0x49 ||
		magic[2] !== 0x43 ||
		magic[3] !== 0x4d
	) {
		throw new Error(
			"This DICOM file could not be decoded. Missing DICM magic bytes at offset 128.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	/* ---- 2. Parse with daikon ---- */
	const daikon = await import("daikon");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let image: ReturnType<typeof daikon.Series.parseImage>;
	try {
		image = daikon.Series.parseImage(new DataView(buffer));
	} catch {
		throw new Error(
			"This DICOM file could not be decoded. The parser could not read the DICOM tags.",
		);
	}

	if (!image) {
		const errorMsg = daikon.Series.parserError;
		throw new Error(
			`This DICOM file could not be decoded. ${errorMsg || "The parser returned no image data."}`,
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	/* ---- 3. Extract dimensions ---- */
	const cols: number | null = image.getCols();
	const rows: number | null = image.getRows();

	if (!cols || !rows || cols <= 0 || rows <= 0) {
		throw new Error(
			"This DICOM file could not be decoded. Missing or invalid image dimensions.",
		);
	}

	if (cols > 32768 || rows > 32768) {
		throw new Error(
			"This DICOM file could not be decoded. Image dimensions exceed the 32768 pixel limit.",
		);
	}

	/* ---- 4. Get pixel data via daikon's interpreted data ---- */
	let pixelResult: {
		data: Float32Array;
		min: number;
		max: number;
		numCols: number;
		numRows: number;
	};

	try {
		pixelResult = image.getInterpretedData(false, true);
	} catch {
		throw new Error(
			"This DICOM file could not be decoded. Failed to extract pixel data — the file may use unsupported transfer syntax or compression.",
		);
	}

	if (!pixelResult || !pixelResult.data || pixelResult.data.length === 0) {
		throw new Error(
			"This DICOM file could not be decoded. No pixel data found in the file.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const width = cols;
	const height = rows;
	const pixelData = pixelResult.data;

	/* ---- 5. Apply window/level transform ---- */
	let windowCenter: number | null = image.getWindowCenter();
	let windowWidth: number | null = image.getWindowWidth();

	// Fall back to auto window/level from pixel min/max
	if (windowCenter == null || windowWidth == null || windowWidth <= 0) {
		const pMin = pixelResult.min;
		const pMax = pixelResult.max;
		windowCenter = (pMin + pMax) / 2;
		windowWidth = pMax - pMin || 1;
	}

	const lower = windowCenter - windowWidth / 2;
	const upper = windowCenter + windowWidth / 2;
	const range = upper - lower;

	/* ---- 6. Build RGBA output ---- */
	const totalPixels = width * height;
	const rgba = new Uint8Array(totalPixels * 4);

	for (let i = 0; i < totalPixels; i++) {
		const raw = pixelData[i];
		let mapped: number;
		if (range <= 0) {
			mapped = 128;
		} else {
			mapped = ((raw - lower) / range) * 255;
			mapped = Math.max(0, Math.min(255, Math.round(mapped)));
		}

		const offset = i * 4;
		rgba[offset] = mapped;
		rgba[offset + 1] = mapped;
		rgba[offset + 2] = mapped;
		rgba[offset + 3] = 255;
	}

	return { data: rgba, width, height };
}
