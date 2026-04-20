// Core tool is a browser-only stub — @imgly/background-removal ships
// its own worker + WASM and is browser-only. Type-only import keeps
// this file wired to the core registration.
import type {} from "@nouploads/core/tools/browser-only-stubs";

export interface RemoveBackgroundOptions {
	signal?: AbortSignal;
}

export interface RemoveBackgroundResult {
	blob: Blob;
	width: number;
	height: number;
}

export async function removeImageBackground(
	input: File,
	options?: RemoveBackgroundOptions,
	onProgress?: (progress: number) => void,
): Promise<RemoveBackgroundResult> {
	const signal = options?.signal;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Get original dimensions
	const bitmap = await createImageBitmap(input);
	const { width, height } = bitmap;
	bitmap.close();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const { removeBackground } = await import("@imgly/background-removal");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const resultBlob = await removeBackground(input, {
		progress: (key: string, current: number, total: number) => {
			if (key === "compute:inference") {
				onProgress?.(Math.round((current / total) * 100));
			}
		},
	});

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	return { blob: resultBlob, width, height };
}
