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

export interface PdfToImageOptions {
	outputFormat: "image/jpeg" | "image/png";
	dpi?: number; // 72 | 150 | 300, default 150
	quality?: number; // 0.0–1.0, for JPEG only
	signal?: AbortSignal;
}

export interface PdfPageImage {
	blob: Blob;
	pageNumber: number;
	width: number;
	height: number;
}

/**
 * Convert a PDF file to an array of images (one per page).
 *
 * Uses pdfjs-dist for parsing/rendering. Each page is rendered onto a
 * DOM canvas at the requested DPI, then exported as JPEG or PNG via
 * `canvas.toBlob()`.
 *
 * Processing is sequential (one page at a time) so memory stays bounded.
 * The optional AbortSignal is checked between pages.
 */
export async function pdfToImages(
	file: File,
	options: PdfToImageOptions,
	onProgress?: (page: number, total: number) => void,
): Promise<PdfPageImage[]> {
	const { outputFormat, dpi = 150, quality, signal } = options;

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
		// Handle password-protected PDFs
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
	const results: PdfPageImage[] = [];
	const scale = dpi / 72;

	for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const page = await pdf.getPage(pageNum);
		const viewport = page.getViewport({ scale });

		const canvas = document.createElement("canvas");
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error(`Failed to get canvas 2D context for page ${pageNum}`);
		}

		// For JPEG output, fill white background (transparent areas would be black)
		if (outputFormat === "image/jpeg") {
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		await page.render({ canvasContext: ctx, viewport, canvas } as never)
			.promise;

		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const blob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(b) => {
					if (b) resolve(b);
					else reject(new Error(`Failed to export page ${pageNum} as image`));
				},
				outputFormat,
				outputFormat === "image/jpeg" ? (quality ?? 0.92) : undefined,
			);
		});

		results.push({
			blob,
			pageNumber: pageNum,
			width: canvas.width,
			height: canvas.height,
		});

		onProgress?.(pageNum, totalPages);
	}

	return results;
}
