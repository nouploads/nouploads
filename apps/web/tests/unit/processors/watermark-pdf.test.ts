import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

/** Create a minimal valid PDF file as a File object. */
async function createTestPdf(name: string, pageCount = 1): Promise<File> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		doc.addPage([612, 792]);
	}
	const bytes = await doc.save();
	return new File([bytes as BlobPart], name, { type: "application/pdf" });
}

describe("watermarkPdf processor", () => {
	it("should watermark a single-page PDF with default options", async () => {
		const { watermarkPdf } = await import(
			"~/features/pdf-tools/processors/watermark-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await watermarkPdf(file);

		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("application/pdf");
		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
		expect(result.originalSize).toBe(file.size);
		expect(result.watermarkedSize).toBeGreaterThan(0);
	});

	it("should watermark a multi-page PDF", async () => {
		const { watermarkPdf } = await import(
			"~/features/pdf-tools/processors/watermark-pdf"
		);

		const file = await createTestPdf("multi.pdf", 5);
		const result = await watermarkPdf(file);

		expect(result.pageCount).toBe(5);

		// Verify the output PDF still has 5 pages
		const outputDoc = await PDFDocument.load(await result.blob.arrayBuffer());
		expect(outputDoc.getPageCount()).toBe(5);
	});

	it("should produce valid PDF magic bytes", async () => {
		const { watermarkPdf } = await import(
			"~/features/pdf-tools/processors/watermark-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await watermarkPdf(file);
		const bytes = new Uint8Array(await result.blob.arrayBuffer());

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(bytes[0]).toBe(0x25);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x44);
		expect(bytes[3]).toBe(0x46);
	});

	it("should apply custom watermark text", async () => {
		const { watermarkPdf } = await import(
			"~/features/pdf-tools/processors/watermark-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await watermarkPdf(file, { text: "DRAFT" });

		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
	});

	it("should apply custom font size, opacity, rotation, and color", async () => {
		const { watermarkPdf } = await import(
			"~/features/pdf-tools/processors/watermark-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await watermarkPdf(file, {
			text: "SECRET",
			fontSize: 80,
			opacity: 0.5,
			rotation: -30,
			color: "#ff0000",
		});

		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
	});

	it("should produce a larger file than the original (font embedding adds size)", async () => {
		const { watermarkPdf } = await import(
			"~/features/pdf-tools/processors/watermark-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await watermarkPdf(file);

		// Watermarked PDF should be larger due to embedded font and text operators
		expect(result.watermarkedSize).toBeGreaterThan(result.originalSize);
	});

	it("should throw on invalid PDF input", async () => {
		const { watermarkPdf } = await import(
			"~/features/pdf-tools/processors/watermark-pdf"
		);

		const badFile = new File(["not a pdf"], "bad.pdf", {
			type: "application/pdf",
		});

		await expect(watermarkPdf(badFile)).rejects.toThrow(/Failed to load PDF/);
	});

	it("should throw immediately if signal is already aborted", async () => {
		const { watermarkPdf } = await import(
			"~/features/pdf-tools/processors/watermark-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const file = await createTestPdf("test.pdf", 1);
		await expect(
			watermarkPdf(file, { signal: controller.signal }),
		).rejects.toThrow("Aborted");
	});
});
