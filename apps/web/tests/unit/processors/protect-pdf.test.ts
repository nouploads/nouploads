import { PDFDocument, StandardFonts } from "pdf-lib";
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

	it("should produce output with valid encryption dictionary structure", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await protectPdf(file, {
			userPassword: "secret",
			allowPrinting: false,
		});
		const bytes = new Uint8Array(await result.blob.arrayBuffer());
		const text = new TextDecoder("latin1").decode(bytes);

		// V=2, R=3, 128-bit key
		expect(text).toContain("/V 2");
		expect(text).toContain("/R 3");
		expect(text).toContain("/Length 128");
		// O and U hashes must be 32-byte (64 hex chars) values
		expect(text).toMatch(/\/O <[0-9a-f]{64}>/);
		expect(text).toMatch(/\/U <[0-9a-f]{64}>/);
		// File ID array must be present
		expect(text).toMatch(/\/ID \[/);
	});

	it("should actually encrypt stream content, not just add metadata", async () => {
		const { protectPdf } = await import(
			"~/features/pdf-tools/processors/protect-pdf"
		);

		// Create a PDF with text content so it has a real content stream
		const doc = await PDFDocument.create();
		const page = doc.addPage([612, 792]);
		const font = await doc.embedFont(StandardFonts.Helvetica);
		page.drawText("UNIQUE_MARKER_TEXT_12345", {
			x: 50,
			y: 700,
			font,
			size: 12,
		});
		// Save without object streams so content is in individual stream objects
		const bytes = await doc.save({ useObjectStreams: false });
		const file = new File([bytes as BlobPart], "text.pdf", {
			type: "application/pdf",
		});

		const result = await protectPdf(file, { userPassword: "test" });
		const protectedBytes = new Uint8Array(await result.blob.arrayBuffer());

		// Find stream data in both files
		const streamPattern = /stream\r?\n/g;
		const origText = new TextDecoder("latin1").decode(bytes);
		const protText = new TextDecoder("latin1").decode(protectedBytes);

		const origStreams: string[] = [];
		const protStreams: string[] = [];

		for (const m of origText.matchAll(streamPattern)) {
			const start = (m.index ?? 0) + m[0].length;
			origStreams.push(origText.slice(start, start + 20));
		}
		for (const m of protText.matchAll(streamPattern)) {
			const start = (m.index ?? 0) + m[0].length;
			protStreams.push(protText.slice(start, start + 20));
		}

		// Both should have streams
		expect(origStreams.length).toBeGreaterThan(0);
		expect(protStreams.length).toBeGreaterThan(0);

		// At least some stream content should differ (encrypted vs plaintext)
		const allSame = origStreams.every(
			(s, i) => protStreams[i] !== undefined && s === protStreams[i],
		);
		expect(allSame).toBe(false);
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
