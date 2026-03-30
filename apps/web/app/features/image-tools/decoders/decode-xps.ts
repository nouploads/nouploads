import type { DecodedImage } from "./types";

/** Extensions that indicate a raster image inside an XPS archive. */
const IMAGE_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".tiff",
	".tif",
	".wdp",
]);

/**
 * Decode an XPS/OXPS file by extracting the largest embedded raster image.
 *
 * XPS and OXPS files are ZIP archives containing XAML pages and embedded
 * resources. Full page layout rendering is not feasible in-browser, so this
 * decoder takes a pragmatic approach: scan the archive for embedded raster
 * images (PNG, JPG, TIFF, WDP) and extract the largest one.
 */
export async function decodeXps(
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
			"This XPS file could not be opened. It may be corrupted or not a valid ZIP archive.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Find all image files in the archive
	let largestPath: string | null = null;
	let largestSize = 0;

	for (const [path, entry] of Object.entries(zip.files)) {
		if (entry.dir) continue;

		const lower = path.toLowerCase();
		const dotIdx = lower.lastIndexOf(".");
		if (dotIdx === -1) continue;

		const ext = lower.slice(dotIdx);
		if (!IMAGE_EXTENSIONS.has(ext)) continue;

		// Use the uncompressed size reported by the ZIP entry
		const size =
			(entry as unknown as { _data?: { uncompressedSize: number } })._data
				?.uncompressedSize ?? 0;
		if (size > largestSize) {
			largestSize = size;
			largestPath = path;
		}
	}

	// If size-based search found nothing (some ZIP libs don't expose size upfront),
	// fall back to extracting all image candidates and comparing byte lengths.
	if (!largestPath) {
		const candidates: { path: string; data: Uint8Array }[] = [];

		for (const [path, entry] of Object.entries(zip.files)) {
			if (entry.dir) continue;

			const lower = path.toLowerCase();
			const dotIdx = lower.lastIndexOf(".");
			if (dotIdx === -1) continue;

			const ext = lower.slice(dotIdx);
			if (!IMAGE_EXTENSIONS.has(ext)) continue;

			if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

			const data = await entry.async("uint8array");
			candidates.push({ path, data });
		}

		if (candidates.length === 0) {
			throw new Error(
				"This XPS file could not be rendered. It may contain only vector content or text.",
			);
		}

		candidates.sort((a, b) => b.data.length - a.data.length);
		return decodeImageBytes(candidates[0].data, candidates[0].path, signal);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const imageEntry = zip.file(largestPath);
	if (!imageEntry) {
		throw new Error(
			"This XPS file could not be rendered. It may contain only vector content or text.",
		);
	}

	const imageBytes = await imageEntry.async("uint8array");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	return decodeImageBytes(imageBytes, largestPath, signal);
}

/**
 * Decode extracted image bytes to RGBA pixels.
 * For TIFF files, delegates to the existing decodeTiff decoder.
 * For browser-native formats (PNG, JPG), uses createImageBitmap.
 */
async function decodeImageBytes(
	data: Uint8Array,
	path: string,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	const lower = path.toLowerCase();
	const ext = lower.slice(lower.lastIndexOf("."));

	// TIFF images need the dedicated decoder
	if (ext === ".tiff" || ext === ".tif") {
		const { decodeTiff } = await import("./decode-tiff");
		return decodeTiff(new Blob([data as BlobPart]), signal);
	}

	// WDP (JPEG XR / HD Photo) — not widely supported, try createImageBitmap
	// and fall through to the standard path.

	// For PNG, JPG, and other browser-native formats: use createImageBitmap
	const mimeMap: Record<string, string> = {
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".wdp": "image/vnd.ms-photo",
	};
	const mime = mimeMap[ext] ?? "application/octet-stream";
	const blob = new Blob([data as BlobPart], { type: mime });

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(blob);
	} catch {
		throw new Error(
			`Could not decode the embedded ${ext.toUpperCase().slice(1)} image from the XPS archive.`,
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
