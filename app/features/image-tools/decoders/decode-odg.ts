import type { DecodedImage } from "./types";

/** Extensions that indicate an embedded image inside an ODF archive. */
const IMAGE_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".bmp",
	".svg",
]);

/**
 * Decode an ODG (OpenDocument Graphics) file by extracting the embedded thumbnail.
 *
 * ODG files are ZIP archives following the ODF specification. Every compliant
 * ODF file contains a `Thumbnails/thumbnail.png` preview image. This decoder
 * extracts that thumbnail first. If no thumbnail is found, it falls back to
 * the largest image in the `Pictures/` directory.
 */
export async function decodeOdg(
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
			"This ODG file could not be opened. It may be corrupted or not a valid ZIP archive.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// 1. Try standard ODF thumbnail location
	const thumbnailEntry = zip.file("Thumbnails/thumbnail.png");
	if (thumbnailEntry) {
		const thumbnailBytes = await thumbnailEntry.async("uint8array");

		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		return decodePngBytes(thumbnailBytes, signal);
	}

	// 2. Fall back to the largest image in Pictures/
	const candidates: { path: string; data: Uint8Array }[] = [];

	for (const [path, entry] of Object.entries(zip.files)) {
		if (entry.dir) continue;

		const lower = path.toLowerCase();
		// Only look in Pictures/ directory
		if (!lower.startsWith("pictures/")) continue;

		const dotIdx = lower.lastIndexOf(".");
		if (dotIdx === -1) continue;

		const ext = lower.slice(dotIdx);
		if (!IMAGE_EXTENSIONS.has(ext)) continue;

		// Skip SVG — cannot easily decode to pixels without a full renderer
		if (ext === ".svg") continue;

		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		const data = await entry.async("uint8array");
		candidates.push({ path, data });
	}

	if (candidates.length === 0) {
		throw new Error(
			"This ODG file could not be rendered. No thumbnail or embedded images were found.",
		);
	}

	// Pick the largest by byte length
	candidates.sort((a, b) => b.data.length - a.data.length);
	return decodePngBytes(candidates[0].data, signal);
}

/**
 * Decode image bytes (PNG, JPG, etc.) to RGBA pixels via createImageBitmap.
 */
async function decodePngBytes(
	data: Uint8Array,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	const blob = new Blob([data]);

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(blob);
	} catch {
		throw new Error(
			"Could not decode the embedded image from the ODG archive.",
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
