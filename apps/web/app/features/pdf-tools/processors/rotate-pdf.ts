import { getTool, isToolResultMulti } from "@nouploads/core";

export type RotationAngle = 90 | 180 | 270;

export interface RotatePdfOptions {
	rotation?: RotationAngle;
	signal?: AbortSignal;
}

export interface RotatePdfResult {
	blob: Blob;
	pageCount: number;
	rotation: RotationAngle;
}

export async function rotatePdf(
	file: File,
	options?: RotatePdfOptions,
): Promise<RotatePdfResult> {
	const signal = options?.signal;
	const rotation = options?.rotation ?? 90;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const tool = getTool("rotate-pdf");
	if (!tool) throw new Error("rotate-pdf tool not found in core registry");

	const bytes = new Uint8Array(await file.arrayBuffer());

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Pass signal to core for cooperative cancellation, AND race against the
	// abort signal for immediate-response UI even when the core tool doesn't
	// poll signal.aborted at every checkpoint.
	const corePromise = tool.execute(
		bytes,
		{ rotation },
		{ onProgress: () => {}, signal },
	);

	let result: Awaited<typeof corePromise>;
	if (signal) {
		result = await Promise.race([
			corePromise,
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
		result = await corePromise;
	}

	if (isToolResultMulti(result)) {
		throw new Error("rotate-pdf unexpectedly returned multiple outputs");
	}

	const blob = new Blob([result.output as BlobPart], {
		type: "application/pdf",
	});

	return {
		blob,
		pageCount: result.metadata?.pageCount as number,
		rotation,
	};
}

/**
 * Read the page count from a PDF file without fully parsing all pages.
 */
export async function getRotatePdfPageCount(file: File): Promise<number> {
	const { PDFDocument } = await import("pdf-lib");
	const bytes = await file.arrayBuffer();
	const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
	return doc.getPageCount();
}
