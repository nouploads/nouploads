import { PDFDocument } from "pdf-lib";
import { beforeAll, describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import "../src/tools/rotate-pdf.js";

async function makePdf(pageCount = 2): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) doc.addPage([200, 300]);
	return doc.save();
}

describe("rotate-pdf tool", () => {
	let pdfBytes: Uint8Array;

	beforeAll(async () => {
		pdfBytes = await makePdf();
	});

	it("is registered under pdf category", () => {
		const tool = getTool("rotate-pdf");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("pdf");
	});

	it("rotates every page by the requested angle and returns a valid PDF", async () => {
		const tool = getTool("rotate-pdf");
		if (!tool) throw new Error("rotate-pdf not registered");
		const result = await tool.execute(pdfBytes, { rotation: 90 }, {});
		if ("outputs" in result) throw new Error("unexpected multi-output");
		expect(result.extension).toBe(".pdf");
		expect(result.mimeType).toBe("application/pdf");
		// Valid PDF magic bytes: %PDF
		expect(result.output[0]).toBe(0x25);
		expect(result.output[1]).toBe(0x50);
		expect(result.output[2]).toBe(0x44);
		expect(result.output[3]).toBe(0x46);

		const rotated = await PDFDocument.load(result.output);
		for (const page of rotated.getPages()) {
			expect(page.getRotation().angle).toBe(90);
		}
	});

	it("rejects invalid rotation angles", async () => {
		const tool = getTool("rotate-pdf");
		if (!tool) throw new Error("rotate-pdf not registered");
		await expect(tool.execute(pdfBytes, { rotation: 45 }, {})).rejects.toThrow(
			/90, 180, or 270/,
		);
	});
});
