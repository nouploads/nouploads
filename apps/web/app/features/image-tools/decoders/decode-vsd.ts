import type { DecodedImage } from "./types";

/**
 * Decode a Visio VSD file by extracting embedded preview images.
 *
 * VSD is an OLE2 compound file. This decoder reads the compound file
 * using the cfb library, then scans all stream data for embedded
 * JPEG, PNG, or BMP images. The largest found image is extracted
 * and decoded to RGBA pixels.
 *
 * Full Visio document rendering is not feasible in-browser.
 */
export async function decodeVsd(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();
	const bytes = new Uint8Array(buffer);

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const CFB = await import("cfb");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let container: ReturnType<typeof CFB.read>;
	try {
		container = CFB.read(bytes, { type: "array" });
	} catch {
		throw new Error(
			"This VSD file could not be opened. It may be corrupted or not a valid OLE2 compound file.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Scan all entries for embedded images
	const images = extractEmbeddedImages(container);

	if (images.length === 0) {
		throw new Error(
			"This VSD file could not be rendered. No embedded preview images were found.",
		);
	}

	// Pick the largest image
	images.sort((a, b) => b.length - a.length);
	return decodeImageBytesToPixels(images[0], signal);
}

/**
 * Scan all streams in an OLE2 container for embedded JPEG, PNG, or BMP data.
 */
function extractEmbeddedImages(container: {
	FileIndex: Array<{
		content: number[] | Uint8Array;
		type: number;
		name: string;
	}>;
	FullPaths: string[];
}): Uint8Array[] {
	const images: Uint8Array[] = [];

	for (const entry of container.FileIndex) {
		// Skip storage entries (type 1) and root (type 5)
		if (!entry.content || entry.content.length < 4) continue;

		const data =
			entry.content instanceof Uint8Array
				? entry.content
				: new Uint8Array(entry.content);

		// Scan for image signatures within the stream
		const found = scanStreamForImages(data);
		for (const img of found) {
			images.push(img);
		}
	}

	return images;
}

/**
 * Scan a byte stream for JPEG, PNG, or BMP signatures and extract them.
 */
function scanStreamForImages(data: Uint8Array): Uint8Array[] {
	const images: Uint8Array[] = [];

	for (let i = 0; i < data.length - 4; i++) {
		// JPEG: FF D8 FF
		if (data[i] === 0xff && data[i + 1] === 0xd8 && data[i + 2] === 0xff) {
			for (let j = i + 3; j < data.length - 1; j++) {
				if (data[j] === 0xff && data[j + 1] === 0xd9) {
					images.push(data.slice(i, j + 2));
					i = j + 1; // Skip past this image
					break;
				}
			}
		}
		// PNG: 89 50 4E 47
		else if (
			data[i] === 0x89 &&
			data[i + 1] === 0x50 &&
			data[i + 2] === 0x4e &&
			data[i + 3] === 0x47
		) {
			for (let j = i + 8; j < data.length - 8; j++) {
				if (
					data[j] === 0x49 &&
					data[j + 1] === 0x45 &&
					data[j + 2] === 0x4e &&
					data[j + 3] === 0x44
				) {
					images.push(data.slice(i, j + 8));
					i = j + 7;
					break;
				}
			}
		}
		// BMP: 42 4D
		else if (data[i] === 0x42 && data[i + 1] === 0x4d && i + 6 <= data.length) {
			const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
			const bmpSize = view.getUint32(i + 2, true);
			if (bmpSize > 14 && bmpSize <= data.length - i && bmpSize < 50_000_000) {
				images.push(data.slice(i, i + bmpSize));
				i = i + bmpSize - 1;
			}
		}
	}

	return images;
}

/**
 * Decode image bytes to RGBA pixels via createImageBitmap.
 */
async function decodeImageBytesToPixels(
	data: Uint8Array,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	const blob = new Blob([data]);

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(blob);
	} catch {
		throw new Error("Could not decode the embedded image from the VSD file.");
	}

	if (signal?.aborted) {
		bitmap.close();
		throw new DOMException("Aborted", "AbortError");
	}

	const canvas = document.createElement("canvas");
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("Could not get canvas 2D context");
	}
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	return {
		data: new Uint8Array(
			imageData.data.buffer,
			imageData.data.byteOffset,
			imageData.data.byteLength,
		),
		width: canvas.width,
		height: canvas.height,
	};
}
