// Core tool is a browser-only stub (pdfjs-dist requires DOMMatrix + a
// canvas, neither available in Node). Type-only import tracks the
// dependency so the architecture drift test sees this tool as bound to
// core even though the real work happens here in the browser.
import type {} from "@nouploads/core/tools/browser-only-stubs";
import { PDFDocument } from "pdf-lib";

let pdfjsReady: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
	if (pdfjsReady) return pdfjsReady;
	const pdfjsLib = await import("pdfjs-dist");
	pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
		"pdfjs-dist/build/pdf.worker.min.mjs",
		import.meta.url,
	).href;
	pdfjsReady = pdfjsLib;
	return pdfjsLib;
}

export type CompressionLevel = "low" | "medium" | "high";

export interface CompressPdfOptions {
	level?: CompressionLevel;
	signal?: AbortSignal;
}

export interface CompressPdfResult {
	blob: Blob;
	originalSize: number;
	compressedSize: number;
	pageCount: number;
}

const LEVEL_SETTINGS: Record<
	CompressionLevel,
	{ dpi: number; quality: number }
> = {
	low: { dpi: 150, quality: 0.85 },
	medium: { dpi: 100, quality: 0.7 },
	high: { dpi: 72, quality: 0.5 },
};

/**
 * Compress a PDF by re-rendering each page as a JPG image at reduced DPI,
 * then embedding those JPGs into a new pdf-lib document.
 *
 * This is a LOSSY approach — the output is a collection of JPG images.
 * Text-heavy PDFs may not shrink much and can even grow larger.
 *
 * Processing is sequential (one page at a time) so memory stays bounded.
 * The optional AbortSignal is checked between pages.
 */
export async function compressPdf(
	file: File,
	options?: CompressPdfOptions,
	onProgress?: (page: number, total: number) => void,
): Promise<CompressPdfResult> {
	const level = options?.level ?? "medium";
	const signal = options?.signal;
	const settings = LEVEL_SETTINGS[level];

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const arrayBuffer = await file.arrayBuffer();

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const pdfjsLib = await getPdfjs();
	let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>;
	try {
		pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
	} catch (err: unknown) {
		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}
		if (
			err instanceof Error &&
			(err.name === "PasswordException" ||
				err.message.includes("password") ||
				err.message.includes("Password"))
		) {
			throw new Error(
				"This PDF is password-protected. Please remove the password and try again.",
			);
		}
		throw err;
	}

	const totalPages = pdf.numPages;
	const newDoc = await PDFDocument.create();
	const scale = settings.dpi / 72;

	for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const page = await pdf.getPage(pageNum);
		const originalViewport = page.getViewport({ scale: 1 });
		const renderViewport = page.getViewport({ scale });

		const canvas = document.createElement("canvas");
		canvas.width = Math.floor(renderViewport.width);
		canvas.height = Math.floor(renderViewport.height);

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error(`Failed to get canvas 2D context for page ${pageNum}`);
		}

		// Fill white background so transparent areas don't turn black in JPG
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		await page.render({
			canvasContext: ctx,
			viewport: renderViewport,
			canvas,
		} as never).promise;

		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const jpgBlob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(b) => {
					if (b) resolve(b);
					else reject(new Error(`Failed to export page ${pageNum} as image`));
				},
				"image/jpeg",
				settings.quality,
			);
		});

		const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());

		// Embed into new PDF at original page dimensions
		const jpgImage = await newDoc.embedJpg(jpgBytes);
		const pdfPage = newDoc.addPage([
			originalViewport.width,
			originalViewport.height,
		]);
		pdfPage.drawImage(jpgImage, {
			x: 0,
			y: 0,
			width: originalViewport.width,
			height: originalViewport.height,
		});

		onProgress?.(pageNum, totalPages);
	}

	const pdfBytes = await newDoc.save();
	const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

	return {
		blob,
		originalSize: file.size,
		compressedSize: blob.size,
		pageCount: totalPages,
	};
}
