/**
 * Pack an array of PNG buffers into the ICO binary format.
 *
 * The ICO format embeds PNG data directly (modern ICO supports PNG payloads).
 * Each image gets a 16-byte directory entry followed by the raw PNG bytes.
 *
 * This function is pure byte manipulation with no DOM or Canvas dependencies,
 * making it directly testable in Node/Vitest.
 */
export function packIco(pngBuffers: Uint8Array[], sizes: number[]): Uint8Array {
	if (pngBuffers.length !== sizes.length) {
		throw new Error("pngBuffers and sizes must have the same length");
	}
	if (pngBuffers.length === 0) {
		throw new Error("At least one PNG buffer is required");
	}

	const headerSize = 6;
	const dirEntrySize = 16;
	const dirSize = dirEntrySize * pngBuffers.length;
	const dataOffset = headerSize + dirSize;

	let totalSize = dataOffset;
	for (const buf of pngBuffers) totalSize += buf.length;

	const result = new Uint8Array(totalSize);
	const view = new DataView(result.buffer);

	// ICO header
	view.setUint16(0, 0, true); // Reserved
	view.setUint16(2, 1, true); // Type: 1 = ICO
	view.setUint16(4, pngBuffers.length, true); // Image count

	// Directory entries + image data
	let offset = dataOffset;
	for (let i = 0; i < pngBuffers.length; i++) {
		const dirOffset = headerSize + i * dirEntrySize;
		result[dirOffset] = sizes[i] < 256 ? sizes[i] : 0; // Width (0 = 256)
		result[dirOffset + 1] = sizes[i] < 256 ? sizes[i] : 0; // Height (0 = 256)
		result[dirOffset + 2] = 0; // Color palette count
		result[dirOffset + 3] = 0; // Reserved
		view.setUint16(dirOffset + 4, 1, true); // Color planes
		view.setUint16(dirOffset + 6, 32, true); // Bits per pixel (32 for RGBA)
		view.setUint32(dirOffset + 8, pngBuffers[i].length, true); // Data size
		view.setUint32(dirOffset + 12, offset, true); // Data offset

		result.set(pngBuffers[i], offset);
		offset += pngBuffers[i].length;
	}

	return result;
}

export interface FaviconSizeResult {
	size: number;
	pngBlob: Blob;
}

export interface FaviconGeneratorResult {
	icoBlob: Blob;
	sizes: FaviconSizeResult[];
}

export const DEFAULT_SIZES = [16, 32, 48];

/**
 * Generate a multi-size favicon ICO file from an image.
 * Uses a Web Worker for canvas resizing and ICO packing.
 */
export async function generateFavicon(
	input: File,
	options?: {
		sizes?: number[];
		signal?: AbortSignal;
	},
): Promise<FaviconGeneratorResult> {
	const sizes = options?.sizes ?? DEFAULT_SIZES;
	const signal = options?.signal;

	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("./favicon-generator.worker.ts", import.meta.url),
			{ type: "module" },
		);

		const onAbort = () => {
			worker.terminate();
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal?.addEventListener("abort", onAbort, { once: true });

		worker.onmessage = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			if (e.data.error) {
				reject(new Error(e.data.error));
			} else {
				resolve({
					icoBlob: e.data.icoBlob,
					sizes: e.data.sizes,
				});
			}
		};
		worker.onerror = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			reject(new Error(e.message || "Favicon worker failed"));
		};

		worker.postMessage({ blob: input, sizes });
	});
}
