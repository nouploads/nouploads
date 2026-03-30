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

describe("protectPdf processor", () => {
	it("should protect a single-page PDF with default options", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await protectPdf(file, {
			userPassword: "test123",
		});

		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("application/pdf");
		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
		expect(result.originalSize).toBe(file.size);
		expect(result.protectedSize).toBeGreaterThan(0);
	});

	it("should protect a multi-page PDF", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const file = await createTestPdf("multi.pdf", 5);
		const result = await protectPdf(file, {
			userPassword: "pass",
			ownerPassword: "admin",
		});

		expect(result.pageCount).toBe(5);
	});

	it("should produce valid PDF magic bytes", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await protectPdf(file, {
			userPassword: "secret",
		});
		const bytes = new Uint8Array(await result.blob.arrayBuffer());

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(bytes[0]).toBe(0x25);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x44);
		expect(bytes[3]).toBe(0x46);
	});

	it("should produce a larger file than the original", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await protectPdf(file, {
			userPassword: "test123",
		});

		expect(result.protectedSize).toBeGreaterThan(result.originalSize);
	});

	it("should include Encrypt dictionary in output", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await protectPdf(file, {
			userPassword: "secret",
		});
		const bytes = new Uint8Array(await result.blob.arrayBuffer());
		const text = new TextDecoder("latin1").decode(bytes);

		expect(text).toContain("/Encrypt");
		expect(text).toContain("/Standard");
	});

	it("should apply custom permission settings", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await protectPdf(file, {
			userPassword: "test",
			allowPrinting: false,
			allowCopying: false,
			allowEditing: false,
		});

		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
	});

	it("should throw on invalid PDF input", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const badFile = new File(["not a pdf"], "bad.pdf", {
			type: "application/pdf",
		});

		await expect(protectPdf(badFile, { userPassword: "test" })).rejects.toThrow(
			/Failed to load PDF/,
		);
	});

	it("should throw immediately if signal is already aborted", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const file = await createTestPdf("test.pdf", 1);
		await expect(
			protectPdf(file, {
				userPassword: "test",
				signal: controller.signal,
			}),
		).rejects.toThrow("Aborted");
	});

	it("should throw when no password is provided", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		await expect(
			protectPdf(file, {
				userPassword: "",
				ownerPassword: "",
			}),
		).rejects.toThrow(/at least one password/i);
	});
});
