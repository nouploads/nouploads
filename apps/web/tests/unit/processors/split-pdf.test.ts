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

describe("splitPdf processor", () => {
	it("should split a 3-page PDF into 3 individual pages", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 3);
		const results = await splitPdf(file);

		expect(results).toHaveLength(3);
		for (let i = 0; i < 3; i++) {
			expect(results[i].blob).toBeInstanceOf(Blob);
			expect(results[i].blob.type).toBe("application/pdf");
			expect(results[i].blob.size).toBeGreaterThan(0);
			expect(results[i].label).toBe(`Page ${i + 1}`);
			expect(results[i].pageCount).toBe(1);

			// Verify each output is a valid single-page PDF
			const doc = await PDFDocument.load(await results[i].blob.arrayBuffer());
			expect(doc.getPageCount()).toBe(1);
		}
	});

	it("should extract a custom range from a PDF", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 5);
		const results = await splitPdf(file, { ranges: "2-4" });

		expect(results).toHaveLength(1);
		expect(results[0].label).toBe("Pages 2-4");
		expect(results[0].pageCount).toBe(3);

		const doc = await PDFDocument.load(await results[0].blob.arrayBuffer());
		expect(doc.getPageCount()).toBe(3);
	});

	it("should handle multiple custom ranges", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 10);
		const results = await splitPdf(file, { ranges: "1-3, 5, 7-10" });

		expect(results).toHaveLength(3);
		expect(results[0].label).toBe("Pages 1-3");
		expect(results[0].pageCount).toBe(3);
		expect(results[1].label).toBe("Page 5");
		expect(results[1].pageCount).toBe(1);
		expect(results[2].label).toBe("Pages 7-10");
		expect(results[2].pageCount).toBe(4);
	});

	it("should produce valid PDF magic bytes", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 2);
		const results = await splitPdf(file);

		for (const result of results) {
			const bytes = new Uint8Array(await result.blob.arrayBuffer());
			// PDF magic bytes: %PDF (25 50 44 46)
			expect(bytes[0]).toBe(0x25);
			expect(bytes[1]).toBe(0x50);
			expect(bytes[2]).toBe(0x44);
			expect(bytes[3]).toBe(0x46);
		}
	});

	it("should generate correct filenames", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("report.pdf", 3);
		const results = await splitPdf(file);

		expect(results[0].filename).toBe("report-page-1.pdf");
		expect(results[1].filename).toBe("report-page-2.pdf");
		expect(results[2].filename).toBe("report-page-3.pdf");
	});

	it("should generate correct filename for single range output", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("report.pdf", 5);
		const results = await splitPdf(file, { ranges: "2-4" });

		// Single range output omits suffix
		expect(results[0].filename).toBe("report.pdf");
	});

	it("should throw on invalid PDF input", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const badFile = new File(["not a pdf"], "bad.pdf", {
			type: "application/pdf",
		});

		await expect(splitPdf(badFile)).rejects.toThrow(/Failed to load PDF/);
	});

	it("should throw on out-of-range page number", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 3);
		await expect(splitPdf(file, { ranges: "5" })).rejects.toThrow(
			/PDF only has 3 pages/,
		);
	});

	it("should throw on invalid range format", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 5);
		await expect(splitPdf(file, { ranges: "abc" })).rejects.toThrow(
			/Invalid page number/,
		);
	});

	it("should throw on reversed range", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 5);
		await expect(splitPdf(file, { ranges: "4-2" })).rejects.toThrow(
			/start page cannot be after end page/,
		);
	});

	it("should call onProgress for each part", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 3);
		const onProgress = vi.fn();
		await splitPdf(file, undefined, onProgress);

		expect(onProgress).toHaveBeenCalledTimes(3);
		expect(onProgress).toHaveBeenCalledWith(1, 3);
		expect(onProgress).toHaveBeenCalledWith(2, 3);
		expect(onProgress).toHaveBeenCalledWith(3, 3);
	});

	it("should throw immediately if signal is already aborted", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const file = await createTestPdf("test.pdf", 2);
		await expect(splitPdf(file, { signal: controller.signal })).rejects.toThrow(
			"Aborted",
		);
	});

	it("should handle a single-page PDF", async () => {
		const { splitPdf } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("single.pdf", 1);
		const results = await splitPdf(file);

		expect(results).toHaveLength(1);
		expect(results[0].label).toBe("Page 1");
		expect(results[0].pageCount).toBe(1);
	});
});

describe("parsePageRanges", () => {
	it("should parse single page numbers", async () => {
		const { parsePageRanges } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const result = parsePageRanges("1, 3, 5", 10);
		expect(result).toHaveLength(3);
		expect(result[0].indices).toEqual([0]);
		expect(result[1].indices).toEqual([2]);
		expect(result[2].indices).toEqual([4]);
	});

	it("should parse page ranges", async () => {
		const { parsePageRanges } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const result = parsePageRanges("1-3", 10);
		expect(result).toHaveLength(1);
		expect(result[0].indices).toEqual([0, 1, 2]);
		expect(result[0].label).toBe("Pages 1-3");
	});

	it("should parse mixed ranges and pages", async () => {
		const { parsePageRanges } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const result = parsePageRanges("1-3, 5, 7-10", 10);
		expect(result).toHaveLength(3);
		expect(result[0].indices).toEqual([0, 1, 2]);
		expect(result[1].indices).toEqual([4]);
		expect(result[2].indices).toEqual([6, 7, 8, 9]);
	});

	it("should handle spaces around dashes", async () => {
		const { parsePageRanges } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const result = parsePageRanges("1 - 3", 5);
		expect(result[0].indices).toEqual([0, 1, 2]);
	});

	it("should throw on page 0", async () => {
		const { parsePageRanges } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		expect(() => parsePageRanges("0", 5)).toThrow(/must be a positive integer/);
	});

	it("should label single-page range correctly", async () => {
		const { parsePageRanges } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const result = parsePageRanges("3-3", 5);
		expect(result[0].label).toBe("Page 3");
		expect(result[0].indices).toEqual([2]);
	});
});

describe("getPdfPageCount (split-pdf)", () => {
	it("should return the correct page count", async () => {
		const { getPdfPageCount } = await import(
			"~/features/pdf-tools/processors/split-pdf"
		);

		const file = await createTestPdf("test.pdf", 5);
		const count = await getPdfPageCount(file);
		expect(count).toBe(5);
	});
});
