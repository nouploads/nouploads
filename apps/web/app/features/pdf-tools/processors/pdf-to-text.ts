// Core tool is a browser-only stub — pdfjs-dist needs DOMMatrix and
// doesn't run in Node. Type-only import keeps the drift-prevention
// architecture test satisfied.
import type {} from "@nouploads/core/tools/pdf-to-text";

/**
 * Safari/WebKit does not implement Symbol.asyncIterator on ReadableStream,
 * which pdfjs-dist v5 requires (it uses `for await...of` on streams
 * returned by `page.getTextContent()`). Polyfill it once before loading
 * pdfjs-dist.
 */
function polyfillReadableStreamAsyncIterator() {
	const proto =
		typeof ReadableStream !== "undefined"
			? (ReadableStream.prototype as unknown as Record<symbol, unknown>)
			: undefined;
	if (proto && !proto[Symbol.asyncIterator]) {
		proto[Symbol.asyncIterator] = async function* (this: ReadableStream) {
			const reader = this.getReader();
			try {
				for (;;) {
					const { done, value } = await reader.read();
					if (done) return;
					yield value;
				}
			} finally {
				reader.releaseLock();
			}
		};
	}
}

let pdfjsReady: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
	if (pdfjsReady) return pdfjsReady;
	polyfillReadableStreamAsyncIterator();
	const pdfjsLib = await import("pdfjs-dist");
	pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
		"pdfjs-dist/build/pdf.worker.min.mjs",
		import.meta.url,
	).href;
	pdfjsReady = pdfjsLib;
	return pdfjsLib;
}

export interface PdfToTextOptions {
	signal?: AbortSignal;
}

export interface PdfToTextResult {
	/** Full extracted text with page separators */
	text: string;
	/** Number of pages in the PDF */
	pageCount: number;
	/** Total character count (excluding page separators) */
	charCount: number;
}

/**
 * Extract all text content from a PDF file.
 *
 * Uses pdfjs-dist to parse each page and extract text items via
 * `page.getTextContent()`. Text items are joined with their
 * end-of-line markers preserved. Pages are separated by
 * `--- Page N ---` headers.
 *
 * Processing is sequential (one page at a time).
 * The optional AbortSignal is checked between pages.
 */
export async function pdfToText(
	file: File,
	options: PdfToTextOptions = {},
	onProgress?: (page: number, total: number) => void,
): Promise<PdfToTextResult> {
	const { signal } = options;

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
	const pageTexts: string[] = [];
	let totalChars = 0;

	for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const page = await pdf.getPage(pageNum);
		const textContent = await page.getTextContent();

		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		let pageText = "";
		for (const item of textContent.items) {
			if ("str" in item) {
				pageText += item.str;
				if (item.hasEOL) {
					pageText += "\n";
				}
			}
		}

		const trimmed = pageText.trim();
		totalChars += trimmed.length;
		pageTexts.push(trimmed);

		onProgress?.(pageNum, totalPages);
	}

	// Join pages with separators
	const parts: string[] = [];
	for (let i = 0; i < pageTexts.length; i++) {
		parts.push(`--- Page ${i + 1} ---`);
		parts.push(pageTexts[i]);
	}
	const fullText = parts.join("\n\n");

	return {
		text: fullText,
		pageCount: totalPages,
		charCount: totalChars,
	};
}
