import { getTool } from "@nouploads/core";

export interface MergePdfOptions {
	signal?: AbortSignal;
}

export async function mergePdfs(
	files: File[],
	options?: MergePdfOptions,
	onProgress?: (completed: number, total: number) => void,
): Promise<Blob> {
	const signal = options?.signal;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
	if (files.length === 0) throw new Error("No files provided");

	const tool = getTool("merge-pdf");
	if (!tool?.executeMulti)
		throw new Error("merge-pdf tool not found in core registry");

	// Convert File[] to Uint8Array[], checking abort between each read
	const inputs: Uint8Array[] = [];
	for (const file of files) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		inputs.push(new Uint8Array(await file.arrayBuffer()));
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Pass signal to core for cooperative cancellation, AND wrap a Promise.race
	// to give the web UI an immediate-response abort even when the core tool
	// hasn't yet been adapted to honor signal.aborted at every checkpoint.
	const mergePromise = tool
		.executeMulti(
			inputs,
			{},
			{
				onProgress: (pct) => {
					const completed = Math.round((pct / 100) * files.length);
					onProgress?.(completed, files.length);
				},
				signal,
			},
		)
		.catch((err: Error) => {
			// Translate core error messages to include filenames
			const match = err.message.match(/PDF file (\d+): (.+)/);
			if (match) {
				const idx = Number.parseInt(match[1], 10) - 1;
				const name = files[idx]?.name ?? `file ${match[1]}`;
				throw new Error(`Failed to load "${name}": ${match[2]}`);
			}
			throw err;
		});

	let result: Awaited<typeof mergePromise>;
	if (signal) {
		result = await Promise.race([
			mergePromise,
			new Promise<never>((_, reject) => {
				if (signal.aborted) reject(new DOMException("Aborted", "AbortError"));
				signal.addEventListener(
					"abort",
					() => reject(new DOMException("Aborted", "AbortError")),
					{ once: true },
				);
			}),
		]);
	} else {
		result = await mergePromise;
	}

	return new Blob([result.output as BlobPart], { type: "application/pdf" });
}

/**
 * Read the page count from a PDF file without fully parsing all pages.
 */
export async function getPdfPageCount(file: File): Promise<number> {
	const { PDFDocument } = await import("pdf-lib");
	const bytes = await file.arrayBuffer();
	const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
	return doc.getPageCount();
}
