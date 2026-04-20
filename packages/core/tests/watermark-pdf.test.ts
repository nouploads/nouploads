import { PDFDocument } from "pdf-lib";
import { beforeAll, describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import "../src/tools/watermark-pdf.js";

async function makePdf(pageCount = 2): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) doc.addPage([200, 300]);
	return doc.save();
}

describe("watermark-pdf tool", () => {
	let pdfBytes: Uint8Array;

	beforeAll(async () => {
		pdfBytes = await makePdf();
	});

	it("is registered under pdf category", () => {
		const tool = getTool("watermark-pdf");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("pdf");
	});

	it("returns a valid PDF with the same page count", async () => {
		const tool = getTool("watermark-pdf");
		if (!tool) throw new Error("watermark-pdf not registered");
		const result = await tool.execute(
			pdfBytes,
			{
				text: "DRAFT",
				fontSize: 48,
				opacity: 0.4,
				rotation: -30,
			},
			{},
		);
		if ("outputs" in result) throw new Error("unexpected multi-output");
		expect(result.mimeType).toBe("application/pdf");
		expect(result.output[0]).toBe(0x25); // %PDF

		const doc = await PDFDocument.load(result.output);
		expect(doc.getPageCount()).toBe(2);
	});

	it("throws on an empty input", async () => {
		const tool = getTool("watermark-pdf");
		if (!tool) throw new Error("watermark-pdf not registered");
		await expect(
			tool.execute(new Uint8Array(), { text: "X" }, {}),
		).rejects.toThrow();
	});
});
