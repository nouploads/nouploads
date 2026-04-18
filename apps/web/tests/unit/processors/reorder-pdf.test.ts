import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

/** Create a minimal valid PDF file as a Uint8Array. */
async function createTestPdf(pageCount = 1): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		doc.addPage([612, 792]);
	}
	const bytes = await doc.save();
	return new Uint8Array(bytes);
}

describe("reorderPdf processor", () => {
	it("should reorder pages of a PDF", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const input = await createTestPdf(3);
		const output = await reorderPdf(input, [2, 0, 1]);

		expect(output).toBeInstanceOf(Uint8Array);
		expect(output.length).toBeGreaterThan(0);

		// Verify output is a valid PDF with 3 pages
		const doc = await PDFDocument.load(output);
		expect(doc.getPageCount()).toBe(3);
	});

	it("should remove pages by omitting them from order", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const input = await createTestPdf(5);
		// Only keep pages 1, 3, 5 (0-indexed: 0, 2, 4)
		const output = await reorderPdf(input, [0, 2, 4]);

		const doc = await PDFDocument.load(output);
		expect(doc.getPageCount()).toBe(3);
	});

	it("should produce valid PDF magic bytes", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const input = await createTestPdf(3);
		const output = await reorderPdf(input, [1, 0, 2]);

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(output[0]).toBe(0x25);
		expect(output[1]).toBe(0x50);
		expect(output[2]).toBe(0x44);
		expect(output[3]).toBe(0x46);
	});

	it("should throw on invalid PDF input", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const badInput = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
		await expect(reorderPdf(badInput, [0])).rejects.toThrow(
			/Failed to load PDF/,
		);
	});

	it("should throw on out-of-range page index", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const input = await createTestPdf(3);
		await expect(reorderPdf(input, [0, 5])).rejects.toThrow(
			/Invalid page (index|number)/,
		);
	});

	it("should throw on empty page order", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const input = await createTestPdf(3);
		await expect(reorderPdf(input, [])).rejects.toThrow(
			/Page order cannot be empty/,
		);
	});

	it("should throw immediately if signal is already aborted", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const input = await createTestPdf(2);
		await expect(reorderPdf(input, [0, 1], controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});

	it("should handle a single-page PDF", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const input = await createTestPdf(1);
		const output = await reorderPdf(input, [0]);

		const doc = await PDFDocument.load(output);
		expect(doc.getPageCount()).toBe(1);
	});

	it("should allow duplicating pages", async () => {
		const { reorderPdf } = await import(
			"~/features/pdf-tools/processors/reorder-pdf"
		);

		const input = await createTestPdf(2);
		// Duplicate page 1 three times
		const output = await reorderPdf(input, [0, 0, 0, 1]);

		const doc = await PDFDocument.load(output);
		expect(doc.getPageCount()).toBe(4);
	});
});

