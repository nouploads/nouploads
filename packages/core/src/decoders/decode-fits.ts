import type { ImageData } from "../backend.js";

/**
 * Decode a FITS (Flexible Image Transport System) file to raw RGBA pixels.
 *
 * Custom parser — no external dependencies.
 * Supports:
 * - BITPIX 8 (uint8), 16 (int16), 32 (int32), -32 (float32), -64 (float64)
 * - NAXIS 2 (grayscale) and NAXIS 3 with NAXIS3=3 (RGB planes)
 * - BSCALE / BZERO physical value transform
 * - Percentile auto-stretch for float data
 *
 * FITS is always big-endian. Data is stored as separate planes (R, G, B)
 * for color images rather than interleaved pixels.
 */
export async function decodeFits(input: Uint8Array): Promise<ImageData> {
	const buffer = input.buffer.slice(
		input.byteOffset,
		input.byteOffset + input.byteLength,
	);

	const bytes = new Uint8Array(buffer);

	if (bytes.length < 2880) {
		throw new Error(
			"This FITS file could not be decoded. The file is too small to contain a valid header.",
		);
	}

	/* ---- 1. Parse header ---- */
	let simple = false;
	let bitpix = 0;
	let naxis = 0;
	let naxis1 = 0;
	let naxis2 = 0;
	let naxis3 = 1;
	let bscale = 1.0;
	let bzero = 0.0;
	let endFound = false;
	let headerBytes = 0;

	for (let block = 0; !endFound && block * 2880 < bytes.length; block++) {
		const blockStart = block * 2880;
		for (let rec = 0; rec < 36; rec++) {
			const recStart = blockStart + rec * 80;
			if (recStart + 80 > bytes.length) break;
			const line = new TextDecoder("ascii").decode(
				bytes.subarray(recStart, recStart + 80),
			);

			const keyword = line.slice(0, 8).trim();
			if (keyword === "END") {
				endFound = true;
				headerBytes = (block + 1) * 2880;
				break;
			}

			if (line[8] !== "=" || line[9] !== " ") continue;
			const valueStr = line.slice(10, 80).split("/")[0].trim();

			switch (keyword) {
				case "SIMPLE":
					simple = valueStr === "T";
					break;
				case "BITPIX":
					bitpix = Number.parseInt(valueStr, 10);
					break;
				case "NAXIS":
					naxis = Number.parseInt(valueStr, 10);
					break;
				case "NAXIS1":
					naxis1 = Number.parseInt(valueStr, 10);
					break;
				case "NAXIS2":
					naxis2 = Number.parseInt(valueStr, 10);
					break;
				case "NAXIS3":
					naxis3 = Number.parseInt(valueStr, 10);
					break;
				case "BSCALE":
					bscale = Number.parseFloat(valueStr);
					break;
				case "BZERO":
					bzero = Number.parseFloat(valueStr);
					break;
			}
		}
	}

	if (!endFound) {
		throw new Error(
			"This FITS file could not be decoded. No END keyword found in header.",
		);
	}
	if (!simple) {
		throw new Error(
			"This FITS file could not be decoded. SIMPLE is not set to T.",
		);
	}
	if (naxis < 2 || naxis > 3) {
		throw new Error(
			"This FITS file could not be decoded. NAXIS must be 2 or 3 for images.",
		);
	}
	if (![8, 16, 32, -32, -64].includes(bitpix)) {
		throw new Error(
			`This FITS file could not be decoded. Unsupported BITPIX value (${bitpix}).`,
		);
	}
	if (naxis1 <= 0 || naxis2 <= 0 || naxis1 > 32768 || naxis2 > 32768) {
		throw new Error(
			"This FITS file could not be decoded. Invalid image dimensions.",
		);
	}

	const width = naxis1;
	const height = naxis2;
	const depth = naxis === 3 ? naxis3 : 1;
	const isColor = depth === 3;

	if (depth !== 1 && depth !== 3) {
		throw new Error(
			"This FITS file could not be decoded. NAXIS3 must be 1 or 3.",
		);
	}

	/* ---- 2. Read pixel data ---- */
	const bytesPerValue = Math.abs(bitpix) / 8;
	const totalPixels = width * height * depth;
	const dataStart = headerBytes;

	if (dataStart + totalPixels * bytesPerValue > bytes.length) {
		throw new Error(
			"This FITS file could not be decoded. Pixel data is truncated.",
		);
	}

	const view = new DataView(buffer, dataStart, totalPixels * bytesPerValue);
	const raw = new Float64Array(totalPixels);

	for (let i = 0; i < totalPixels; i++) {
		const offset = i * bytesPerValue;
		switch (bitpix) {
			case 8:
				raw[i] = view.getUint8(offset);
				break;
			case 16:
				raw[i] = view.getInt16(offset, false); // big-endian
				break;
			case 32:
				raw[i] = view.getInt32(offset, false);
				break;
			case -32:
				raw[i] = view.getFloat32(offset, false);
				break;
			case -64:
				raw[i] = view.getFloat64(offset, false);
				break;
		}
	}

	/* ---- 3. Apply BSCALE/BZERO and map to 0-255 ---- */
	const planeSize = width * height;
	const isFloat = bitpix < 0;
	const needsTransform = bscale !== 1.0 || bzero !== 0.0;

	// Apply physical value transform
	if (needsTransform) {
		for (let i = 0; i < totalPixels; i++) {
			raw[i] = raw[i] * bscale + bzero;
		}
	}

	/**
	 * Map a single plane of float64 values to 0-255 using percentile stretch.
	 * For float data: auto-stretch using 1st/99th percentile.
	 * For integer data (already transformed): clamp to 0-255.
	 */
	function mapPlane(plane: Float64Array): Uint8Array {
		const out = new Uint8Array(plane.length);

		if (isFloat || needsTransform) {
			// Percentile auto-stretch
			const sorted = Float64Array.from(plane).sort();
			const p1Idx = Math.floor(sorted.length * 0.01);
			const p99Idx = Math.min(
				Math.floor(sorted.length * 0.99),
				sorted.length - 1,
			);
			const p1 = sorted[p1Idx];
			const p99 = sorted[p99Idx];
			const range = p99 - p1;

			if (range <= 0) {
				// All values are the same — map to mid-gray
				out.fill(128);
			} else {
				for (let i = 0; i < plane.length; i++) {
					const stretched = ((plane[i] - p1) / range) * 255;
					out[i] = Math.max(0, Math.min(255, Math.round(stretched)));
				}
			}
		} else {
			// Integer data without transform — already 0-255 range (BITPIX=8)
			for (let i = 0; i < plane.length; i++) {
				out[i] = Math.max(0, Math.min(255, Math.round(plane[i])));
			}
		}

		return out;
	}

	/* ---- 4. Build RGBA output ---- */
	const rgba = new Uint8Array(width * height * 4);

	if (isColor) {
		// Three separate planes: R, G, B
		const rPlane = mapPlane(raw.subarray(0, planeSize));
		const gPlane = mapPlane(raw.subarray(planeSize, planeSize * 2));
		const bPlane = mapPlane(raw.subarray(planeSize * 2, planeSize * 3));

		for (let i = 0; i < planeSize; i++) {
			rgba[i * 4] = rPlane[i];
			rgba[i * 4 + 1] = gPlane[i];
			rgba[i * 4 + 2] = bPlane[i];
			rgba[i * 4 + 3] = 255;
		}
	} else {
		// Single plane — grayscale
		const gray = mapPlane(raw.subarray(0, planeSize));

		for (let i = 0; i < planeSize; i++) {
			rgba[i * 4] = gray[i];
			rgba[i * 4 + 1] = gray[i];
			rgba[i * 4 + 2] = gray[i];
			rgba[i * 4 + 3] = 255;
		}
	}

	return { data: rgba, width, height };
}
