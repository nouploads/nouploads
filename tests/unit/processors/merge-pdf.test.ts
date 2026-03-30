import { PDFDocument } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";

/** Create a minimal valid PDF file as a File object. */
async function createTestPdf(name: string, pageCount = 1): Promise<File> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		doc.addPage([612, 792]);
	}
	const bytes = await doc.save();
	return new File([bytes as BlobPart], name, { type: "application/pdf" });
}

describe("mergePdfs processor", () => {
	it("should merge two single-page PDFs into a two-page PDF", async () => {
		const { mergePdfs } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const fileA = await createTestPdf("a.pdf", 1);
		const fileB = await createTestPdf("b.pdf", 1);

		const result = await mergePdfs([fileA, fileB]);

		expect(result).toBeInstanceOf(Blob);
		expect(result.type).toBe("application/pdf");
		expect(result.size).toBeGreaterThan(0);

		// Verify the merged PDF has 2 pages
		const merged = await PDFDocument.load(await result.arrayBuffer());
		expect(merged.getPageCount()).toBe(2);
	});

	it("should merge PDFs with multiple pages", async () => {
		const { mergePdfs } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const fileA = await createTestPdf("a.pdf", 3);
		const fileB = await createTestPdf("b.pdf", 2);

		const result = await mergePdfs([fileA, fileB]);
		const merged = await PDFDocument.load(await result.arrayBuffer());
		expect(merged.getPageCount()).toBe(5);
	});

	it("should produce valid PDF magic bytes", async () => {
		const { mergePdfs } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const fileA = await createTestPdf("a.pdf", 1);
		const fileB = await createTestPdf("b.pdf", 1);

		const result = await mergePdfs([fileA, fileB]);
		const bytes = new Uint8Array(await result.arrayBuffer());

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(bytes[0]).toBe(0x25);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x44);
		expect(bytes[3]).toBe(0x46);
	});

	it("should throw if no files are provided", async () => {
		const { mergePdfs } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		await expect(mergePdfs([])).rejects.toThrow("No files provided");
	});

	it("should throw on invalid PDF input", async () => {
		const { mergePdfs } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const badFile = new File(["not a pdf"], "bad.pdf", {
			type: "application/pdf",
		});
		const goodFile = await createTestPdf("good.pdf", 1);

		await expect(mergePdfs([badFile, goodFile])).rejects.toThrow(
			/Failed to load "bad.pdf"/,
		);
	});

	it("should call onProgress for each file", async () => {
		const { mergePdfs } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const fileA = await createTestPdf("a.pdf", 1);
		const fileB = await createTestPdf("b.pdf", 1);
		const fileC = await createTestPdf("c.pdf", 1);

		const onProgress = vi.fn();
		await mergePdfs([fileA, fileB, fileC], undefined, onProgress);

		expect(onProgress).toHaveBeenCalledTimes(3);
		expect(onProgress).toHaveBeenCalledWith(1, 3);
		expect(onProgress).toHaveBeenCalledWith(2, 3);
		expect(onProgress).toHaveBeenCalledWith(3, 3);
	});

	it("should throw immediately if signal is already aborted", async () => {
		const { mergePdfs } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const file = await createTestPdf("a.pdf", 1);
		await expect(
			mergePdfs([file], { signal: controller.signal }),
		).rejects.toThrow("Aborted");
	});

	it("should abort mid-merge when signal fires", async () => {
		const { mergePdfs } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const fileA = await createTestPdf("a.pdf", 1);
		const fileB = await createTestPdf("b.pdf", 1);
		const fileC = await createTestPdf("c.pdf", 1);

		const controller = new AbortController();
		const onProgress = vi.fn().mockImplementation((completed) => {
			if (completed === 1) controller.abort();
		});

		await expect(
			mergePdfs(
				[fileA, fileB, fileC],
				{ signal: controller.signal },
				onProgress,
			),
		).rejects.toThrow("Aborted");

		// Only the first file should have completed before abort
		expect(onProgress).toHaveBeenCalledWith(1, 3);
	});
});

describe("getPdfPageCount", () => {
	it("should return the correct page count", async () => {
		const { getPdfPageCount } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const file = await createTestPdf("test.pdf", 5);
		const count = await getPdfPageCount(file);
		expect(count).toBe(5);
	});

	it("should return 1 for a single-page PDF", async () => {
		const { getPdfPageCount } = await import(
			"~/features/pdf-tools/processors/merge-pdf"
		);

		const file = await createTestPdf("single.pdf", 1);
		const count = await getPdfPageCount(file);
		expect(count).toBe(1);
	});
});
