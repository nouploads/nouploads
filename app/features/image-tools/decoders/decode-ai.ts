import type { DecodedImage } from "./types";

/**
 * Decode an Adobe Illustrator (.ai) file.
 *
 * Modern AI files (Illustrator v9+, year 2000 onwards) are valid PDFs and start
 * with `%PDF-`. These are rendered via pdfjs-dist at 2x scale for quality.
 *
 * Legacy AI files start with `%!PS-` (PostScript). For those, we fall back to
 * the EPS decoder which extracts the embedded preview image.
 */
export async function decodeAi(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();
	const header = new Uint8Array(buffer, 0, Math.min(5, buffer.byteLength));

	// Check if PDF-based AI (vast majority since Illustrator v9, year 2000)
	const isPdf =
		header[0] === 0x25 && // %
		header[1] === 0x50 && // P
		header[2] === 0x44 && // D
		header[3] === 0x46; // F

	if (!isPdf) {
		// Legacy EPS-based AI — try the EPS decoder
		const { decodeEps } = await import("./decode-eps");
		return decodeEps(input, signal);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Use pdfjs-dist to render the first page
	const pdfjs = await import("pdfjs-dist");
	pdfjs.GlobalWorkerOptions.workerSrc = "";

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const page = await pdf.getPage(1);
	const viewport = page.getViewport({ scale: 2 }); // 2x for quality

	const canvas = document.createElement("canvas");
	canvas.width = Math.round(viewport.width);
	canvas.height = Math.round(viewport.height);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas 2D context");

	await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

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
