import { degrees, PDFDocument } from "pdf-lib";
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

/** Create a PDF with pages already rotated to a given angle. */
async function createRotatedTestPdf(
	name: string,
	existingRotation: number,
	pageCount = 1,
): Promise<File> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		const page = doc.addPage([612, 792]);
		page.setRotation(degrees(existingRotation));
	}
	const bytes = await doc.save();
	return new File([bytes as BlobPart], name, { type: "application/pdf" });
}

describe("rotatePdf processor", () => {
	it("should rotate a single-page PDF 90° clockwise", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await rotatePdf(file, { rotation: 90 });

		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("application/pdf");
		expect(result.blob.size).toBeGreaterThan(0);
		expect(result.pageCount).toBe(1);
		expect(result.rotation).toBe(90);

		// Verify the page is actually rotated
		const doc = await PDFDocument.load(await result.blob.arrayBuffer());
		const page = doc.getPage(0);
		expect(page.getRotation().angle).toBe(90);
	});

	it("should rotate all pages of a multi-page PDF", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const file = await createTestPdf("multi.pdf", 3);
		const result = await rotatePdf(file, { rotation: 180 });

		expect(result.pageCount).toBe(3);

		const doc = await PDFDocument.load(await result.blob.arrayBuffer());
		for (let i = 0; i < 3; i++) {
			expect(doc.getPage(i).getRotation().angle).toBe(180);
		}
	});

	it("should rotate 270° (90° counter-clockwise)", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const file = await createTestPdf("test.pdf", 1);
		const result = await rotatePdf(file, { rotation: 270 });

		const doc = await PDFDocument.load(await result.blob.arrayBuffer());
		expect(doc.getPage(0).getRotation().angle).toBe(270);
	});

	it("should add rotation to existing page rotation", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		// Page already rotated 90°, rotate another 90° -> 180°
		const file = await createRotatedTestPdf("rotated.pdf", 90, 1);
		const result = await rotatePdf(file, { rotation: 90 });

		const doc = await PDFDocument.load(await result.blob.arrayBuffer());
		expect(doc.getPage(0).getRotation().angle).toBe(180);
	});

	it("should wrap rotation past 360°", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		// Page at 270°, rotate another 180° -> (270+180)%360 = 90°
		const file = await createRotatedTestPdf("wrap.pdf", 270, 1);
		const result = await rotatePdf(file, { rotation: 180 });

		const doc = await PDFDocument.load(await result.blob.arrayBuffer());
		expect(doc.getPage(0).getRotation().angle).toBe(90);
	});

	it("should default to 90° rotation", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const file = await createTestPdf("default.pdf", 1);
		const result = await rotatePdf(file);

		const doc = await PDFDocument.load(await result.blob.arrayBuffer());
		expect(doc.getPage(0).getRotation().angle).toBe(90);
		expect(result.rotation).toBe(90);
	});

	it("should produce valid PDF magic bytes", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const file = await createTestPdf("magic.pdf", 1);
		const result = await rotatePdf(file, { rotation: 90 });
		const bytes = new Uint8Array(await result.blob.arrayBuffer());

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(bytes[0]).toBe(0x25);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x44);
		expect(bytes[3]).toBe(0x46);
	});

	it("should throw on invalid PDF input", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const badFile = new File(["not a pdf"], "bad.pdf", {
			type: "application/pdf",
		});

		await expect(rotatePdf(badFile)).rejects.toThrow(/Failed to load PDF/);
	});

	it("should throw immediately if signal is already aborted", async () => {
		const { rotatePdf } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const file = await createTestPdf("abort.pdf", 1);
		await expect(
			rotatePdf(file, { signal: controller.signal }),
		).rejects.toThrow("Aborted");
	});
});

describe("getRotatePdfPageCount", () => {
	it("should return the correct page count", async () => {
		const { getRotatePdfPageCount } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const file = await createTestPdf("count.pdf", 4);
		const count = await getRotatePdfPageCount(file);
		expect(count).toBe(4);
	});

	it("should return 1 for a single-page PDF", async () => {
		const { getRotatePdfPageCount } = await import(
			"~/features/pdf-tools/processors/rotate-pdf"
		);

		const file = await createTestPdf("single.pdf", 1);
		const count = await getRotatePdfPageCount(file);
		expect(count).toBe(1);
	});
});
