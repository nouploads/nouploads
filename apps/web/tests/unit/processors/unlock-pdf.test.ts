import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

/** Create a minimal valid PDF file as a File object. */
async function createTestPdf(name: string, pageCount = 1): Promise<File> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		doc.addPage([612, 792]);
	}
	const bytes = await doc.save();
	return new File([bytes as BlobPart], name, {
		type: "application/pdf",
	});
}

describe("unlockPdf processor", () => {
	it("should pass through a normal PDF and produce valid output", async () => {
		const { unlockPdf } = await import(
			"~/features/pdf-tools/processors/unlock-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await unlockPdf(file);

		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("application/pdf");
		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
		expect(result.originalSize).toBe(file.size);
		expect(result.unlockedSize).toBeGreaterThan(0);
	});

	it("should preserve page count in a multi-page PDF", async () => {
		const { unlockPdf } = await import(
			"~/features/pdf-tools/processors/unlock-pdf"
		);

		const file = await createTestPdf("multi.pdf", 4);
		const result = await unlockPdf(file);

		expect(result.pageCount).toBe(4);

		const outputDoc = await PDFDocument.load(await result.blob.arrayBuffer());
		expect(outputDoc.getPageCount()).toBe(4);
	});

	it("should produce valid PDF magic bytes", async () => {
		const { unlockPdf } = await import(
			"~/features/pdf-tools/processors/unlock-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await unlockPdf(file);
		const bytes = new Uint8Array(await result.blob.arrayBuffer());

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(bytes[0]).toBe(0x25);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x44);
		expect(bytes[3]).toBe(0x46);
	});

	it("should throw on invalid PDF input", async () => {
		const { unlockPdf } = await import(
			"~/features/pdf-tools/processors/unlock-pdf"
		);

		const badFile = new File(["not a pdf"], "bad.pdf", {
			type: "application/pdf",
		});

		await expect(unlockPdf(badFile)).rejects.toThrow(/Failed to load PDF/);
	});

	it("should throw immediately if signal is already aborted", async () => {
		const { unlockPdf } = await import(
			"~/features/pdf-tools/processors/unlock-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const file = await createTestPdf("test.pdf", 1);
		await expect(
			unlockPdf(file, { signal: controller.signal }),
		).rejects.toThrow("Aborted");
	});

	it("should accept an optional password parameter", async () => {
		const { unlockPdf } = await import(
			"~/features/pdf-tools/processors/unlock-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await unlockPdf(file, {
			password: "somepassword",
		});

		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
	});
});
