import { PDFDocument } from "pdf-lib";

export interface ImageToPdfOptions {
	pageSize?: "fit" | "a4" | "letter";
	signal?: AbortSignal;
}

const PAGE_SIZES = {
	a4: { width: 595.28, height: 841.89 },
	letter: { width: 612, height: 792 },
} as const;

const MARGIN = 36; // 0.5 inch margin for fixed-size pages

/**
 * Convert an image file to a format that pdf-lib can embed (JPG or PNG).
 * JPG and PNG files are passed through; all other formats are converted
 * to PNG via canvas.
 */
async function imageToEmbeddable(
	file: File,
): Promise<{ bytes: Uint8Array; type: "jpg" | "png" }> {
	if (file.type === "image/jpeg") {
		return {
			bytes: new Uint8Array(await file.arrayBuffer()),
			type: "jpg",
		};
	}
	if (file.type === "image/png") {
		return {
			bytes: new Uint8Array(await file.arrayBuffer()),
			type: "png",
		};
	}
	// Convert to PNG via canvas for all other formats (WebP, GIF, BMP, etc.)
	const bitmap = await createImageBitmap(file);
	const canvas = document.createElement("canvas");
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("Failed to get canvas context");
	}
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();
	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((b) => {
			if (b) resolve(b);
			else reject(new Error("Failed to convert image to PNG"));
		}, "image/png");
	});
	return {
		bytes: new Uint8Array(await blob.arrayBuffer()),
		type: "png",
	};
}

/**
 * Combine one or more images into a single PDF document.
 *
 * Each image becomes one page. Page size can be "fit" (match image dimensions),
 * "a4", or "letter". Fixed-size pages center the image with margins.
 */
export async function imagesToPdf(
	images: File[],
	options?: ImageToPdfOptions,
	onProgress?: (completed: number, total: number) => void,
): Promise<Blob> {
	if (images.length === 0) {
		throw new Error("No images provided");
	}

	const pageSize = options?.pageSize ?? "fit";
	const signal = options?.signal;

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const pdfDoc = await PDFDocument.create();

	for (let i = 0; i < images.length; i++) {
		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const { bytes, type } = await imageToEmbeddable(images[i]);

		if (signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const embeddedImage =
			type === "jpg"
				? await pdfDoc.embedJpg(bytes)
				: await pdfDoc.embedPng(bytes);

		const imgWidth = embeddedImage.width;
		const imgHeight = embeddedImage.height;

		let pageWidth: number;
		let pageHeight: number;
		let drawX: number;
		let drawY: number;
		let drawWidth: number;
		let drawHeight: number;

		if (pageSize === "fit") {
			pageWidth = imgWidth;
			pageHeight = imgHeight;
			drawX = 0;
			drawY = 0;
			drawWidth = imgWidth;
			drawHeight = imgHeight;
		} else {
			const dimensions = PAGE_SIZES[pageSize];
			pageWidth = dimensions.width;
			pageHeight = dimensions.height;

			const availableWidth = pageWidth - 2 * MARGIN;
			const availableHeight = pageHeight - 2 * MARGIN;

			const scale = Math.min(
				availableWidth / imgWidth,
				availableHeight / imgHeight,
				1, // don't scale up
			);

			drawWidth = imgWidth * scale;
			drawHeight = imgHeight * scale;
			drawX = (pageWidth - drawWidth) / 2;
			drawY = (pageHeight - drawHeight) / 2;
		}

		const page = pdfDoc.addPage([pageWidth, pageHeight]);
		page.drawImage(embeddedImage, {
			x: drawX,
			y: drawY,
			width: drawWidth,
			height: drawHeight,
		});

		onProgress?.(i + 1, images.length);
	}

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}
