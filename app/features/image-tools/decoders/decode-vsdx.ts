import type { DecodedImage } from "./types";

/**
 * Decode a Visio VSDX file by extracting the embedded thumbnail or largest image.
 *
 * VSDX files are ZIP (OOXML) archives. They typically contain a thumbnail
 * in `docProps/thumbnail.jpeg` or `docProps/thumbnail.emf`, plus media files
 * in `visio/media/`. This decoder extracts the JPEG thumbnail first, then
 * falls back to the largest raster image in the archive.
 */
export async function decodeVsdx(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const { default: JSZip } = await import("jszip");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>;
	try {
		zip = await JSZip.loadAsync(buffer);
	} catch {
		throw new Error(
			"This VSDX file could not be opened. It may be corrupted or not a valid ZIP archive.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// 1. Try standard OOXML thumbnail locations
	const thumbnailPaths = [
		"docProps/thumbnail.jpeg",
		"docProps/thumbnail.jpg",
		"docProps/thumbnail.png",
	];

	for (const path of thumbnailPaths) {
		const entry = zip.file(path);
		if (entry) {
			const data = await entry.async("uint8array");
			if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
			return decodeImageBytesToPixels(data, signal);
		}
	}

	// 2. Search for images in visio/media/ or any image path
	const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".bmp", ".gif"]);
	const candidates: { path: string; data: Uint8Array }[] = [];

	for (const [path, entry] of Object.entries(zip.files)) {
		if (entry.dir) continue;

		const lower = path.toLowerCase();
		const dotIdx = lower.lastIndexOf(".");
		if (dotIdx === -1) continue;

		const ext = lower.slice(dotIdx);
		if (!imageExtensions.has(ext)) continue;

		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		const data = await entry.async("uint8array");
		candidates.push({ path, data });
	}

	if (candidates.length === 0) {
		throw new Error(
			"This VSDX file could not be rendered. No thumbnail or embedded images were found.",
		);
	}

	// Pick the largest by byte length
	candidates.sort((a, b) => b.data.length - a.data.length);
	return decodeImageBytesToPixels(candidates[0].data, signal);
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
		throw new Error(
			"Could not decode the embedded image from the VSDX archive.",
		);
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
