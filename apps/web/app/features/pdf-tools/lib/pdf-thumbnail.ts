import type { PDFDocumentProxy } from "pdfjs-dist";

let pdfjsReady: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
	if (pdfjsReady) return pdfjsReady;
	const lib = await import("pdfjs-dist");
	lib.GlobalWorkerOptions.workerSrc = new URL(
		"pdfjs-dist/build/pdf.worker.min.mjs",
		import.meta.url,
	).href;
	pdfjsReady = lib;
	return lib;
}

/**
 * Load a PDF document from raw bytes. The caller should cache the returned
 * proxy and call `destroy()` when done (e.g. on file change / unmount).
 *
 * Uses `.slice()` because pdfjs-dist transfers ownership of the ArrayBuffer.
 */
export async function loadPdfDocument(
	data: Uint8Array,
): Promise<PDFDocumentProxy> {
	const pdfjs = await getPdfjs();
	return pdfjs.getDocument({ data: data.slice() }).promise;
}

/**
 * Render a single PDF page to an off-screen canvas.
 *
 * `rotation` is the *user-requested* additional rotation (0, 90, 180, 270).
 * Internally we add it to the page's intrinsic rotation so the preview
 * matches what pdf-lib produces (additive rotation).
 *
 * Returns the canvas so callers can draw additional overlays before
 * converting to a data URL.
 */
export async function renderPdfPageToCanvas(
	pdfDoc: PDFDocumentProxy,
	pageNumber: number,
	options?: { scale?: number; rotation?: number; signal?: AbortSignal },
): Promise<HTMLCanvasElement> {
	const { scale = 0.5, rotation = 0, signal } = options ?? {};
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const page = await pdfDoc.getPage(pageNumber);

	// CRITICAL: getViewport({ rotation }) is absolute — it replaces the page's
	// intrinsic rotation. pdf-lib adds the user's angle to the existing one, so
	// we must do the same here to make the preview match the actual output.
	const totalRotation = (page.rotate + rotation) % 360;
	const viewport = page.getViewport({ scale, rotation: totalRotation });

	const canvas = document.createElement("canvas");
	canvas.width = Math.floor(viewport.width);
	canvas.height = Math.floor(viewport.height);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get canvas 2D context");
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;

	return canvas;
}

/**
 * Render a single PDF page to a PNG data-URL.
 * Convenience wrapper around `renderPdfPageToCanvas`.
 */
export async function renderPdfPageToDataUrl(
	pdfDoc: PDFDocumentProxy,
	pageNumber: number,
	options?: {
		scale?: number;
		rotation?: number;
		signal?: AbortSignal;
		format?: "png" | "jpeg";
		quality?: number;
	},
): Promise<string> {
	const { format = "png", quality, ...canvasOpts } = options ?? {};
	const canvas = await renderPdfPageToCanvas(pdfDoc, pageNumber, canvasOpts);
	return format === "jpeg"
		? canvas.toDataURL("image/jpeg", quality ?? 0.7)
		: canvas.toDataURL("image/png");
}
