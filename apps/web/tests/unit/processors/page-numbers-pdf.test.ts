import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

// Importing the web processor registers page-numbers-pdf as a side effect
// (it does `import "@nouploads/core/tools/page-numbers-pdf"`).

/** Create a minimal valid PDF file as a File object. */
async function createTestPdf(name: string, pageCount = 1): Promise<File> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		doc.addPage([612, 792]);
	}
	const bytes = await doc.save();
	return new File([bytes as BlobPart], name, { type: "application/pdf" });
}

describe("pageNumbersPdf processor", () => {
	it("should add page numbers to a single-page PDF with default options", async () => {
		const { pageNumbersPdf } = await import(
			"~/features/pdf-tools/processors/page-numbers-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await pageNumbersPdf(file);

		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("application/pdf");
		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
		expect(result.originalSize).toBe(file.size);
		expect(result.numberedSize).toBeGreaterThan(0);
	});

	it("should add page numbers to a multi-page PDF", async () => {
		const { pageNumbersPdf } = await import(
			"~/features/pdf-tools/processors/page-numbers-pdf"
		);

		const file = await createTestPdf("multi.pdf", 5);
		const result = await pageNumbersPdf(file);

		expect(result.pageCount).toBe(5);

		// Verify the output PDF still has 5 pages
		const outputDoc = await PDFDocument.load(await result.blob.arrayBuffer());
		expect(outputDoc.getPageCount()).toBe(5);
	});

	it("should produce valid PDF magic bytes", async () => {
		const { pageNumbersPdf } = await import(
			"~/features/pdf-tools/processors/page-numbers-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await pageNumbersPdf(file);
		const bytes = new Uint8Array(await result.blob.arrayBuffer());

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(bytes[0]).toBe(0x25);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x44);
		expect(bytes[3]).toBe(0x46);
	});

	it("should apply custom format option", async () => {
		const { pageNumbersPdf } = await import(
			"~/features/pdf-tools/processors/page-numbers-pdf"
		);

		const file = await createTestPdf("test.pdf", 3);
		const result = await pageNumbersPdf(file, {
			format: "page-n-of-total",
		});

		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(3);
	});

	it("should apply custom position and fontSize", async () => {
		const { pageNumbersPdf } = await import(
			"~/features/pdf-tools/processors/page-numbers-pdf"
		);

		const file = await createTestPdf("test.pdf", 2);
		const result = await pageNumbersPdf(file, {
			position: "top-right",
			fontSize: 18,
			margin: 60,
		});

		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(2);
	});

	it("should produce a larger file than the original (font embedding adds size)", async () => {
		const { pageNumbersPdf } = await import(
			"~/features/pdf-tools/processors/page-numbers-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await pageNumbersPdf(file);

		expect(result.numberedSize).toBeGreaterThan(result.originalSize);
	});

	it("should throw on invalid PDF input", async () => {
		const { pageNumbersPdf } = await import(
			"~/features/pdf-tools/processors/page-numbers-pdf"
		);

		const badFile = new File(["not a pdf"], "bad.pdf", {
			type: "application/pdf",
		});

		await expect(pageNumbersPdf(badFile)).rejects.toThrow(/Failed to load PDF/);
	});

	it("should throw immediately if signal is already aborted", async () => {
		const { pageNumbersPdf } = await import(
			"~/features/pdf-tools/processors/page-numbers-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const file = await createTestPdf("test.pdf", 1);
		await expect(
			pageNumbersPdf(file, { signal: controller.signal }),
		).rejects.toThrow("Aborted");
	});
});
