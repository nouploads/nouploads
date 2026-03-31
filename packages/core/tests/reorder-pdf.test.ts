import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/reorder-pdf.js";

/** Create a minimal valid PDF as Uint8Array. */
async function createTestPdfBytes(pageCount = 1): Promise<Uint8Array> {
	const { PDFDocument } = await import("pdf-lib");
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		doc.addPage([612, 792]);
	}
	const bytes = await doc.save();
	return new Uint8Array(bytes);
}

describe("reorder-pdf tool", () => {
	it("should be registered", () => {
		const tool = getTool("reorder-pdf");
		expect(tool).toBeDefined();
		expect(tool?.id).toBe("reorder-pdf");
		expect(tool?.category).toBe("pdf");
	});

	it("should reorder pages of a PDF", async () => {
		const tool = getTool("reorder-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(3);
		const result = await tool.execute(input, { order: "3,1,2" }, {});

		expect(result.extension).toBe(".pdf");
		expect(result.mimeType).toBe("application/pdf");
		expect(result.output.length).toBeGreaterThan(0);
		expect(result.metadata?.pageCount).toBe(3);
		expect(result.metadata?.originalPageCount).toBe(3);

		// Valid PDF magic bytes
		expect(result.output[0]).toBe(0x25);
		expect(result.output[1]).toBe(0x50);
		expect(result.output[2]).toBe(0x44);
		expect(result.output[3]).toBe(0x46);
	});

	it("should remove pages by omitting them from order", async () => {
		const tool = getTool("reorder-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(5);
		// Only include pages 1, 3, 5 — removes pages 2, 4
		const result = await tool.execute(input, { order: "1,3,5" }, {});

		expect(result.metadata?.pageCount).toBe(3);
		expect(result.metadata?.originalPageCount).toBe(5);
	});

	it("should return all pages in original order when order is empty", async () => {
		const tool = getTool("reorder-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(3);
		const result = await tool.execute(input, { order: "" }, {});

		expect(result.metadata?.pageCount).toBe(3);
	});

	it("should throw on invalid page number", async () => {
		const tool = getTool("reorder-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(3);
		await expect(tool.execute(input, { order: "1,4" }, {})).rejects.toThrow(
			/PDF only has 3 pages/,
		);
	});

	it("should throw on non-numeric page values", async () => {
		const tool = getTool("reorder-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(3);
		await expect(tool.execute(input, { order: "1,abc,3" }, {})).rejects.toThrow(
			/must be a positive integer/,
		);
	});

	it("should throw on invalid PDF input", async () => {
		const tool = getTool("reorder-pdf");
		if (!tool) throw new Error("not registered");

		const badInput = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
		await expect(tool.execute(badInput, { order: "1" }, {})).rejects.toThrow(
			/Failed to load PDF/,
		);
	});

	it("should produce valid PDF magic bytes", async () => {
		const tool = getTool("reorder-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(2);
		const result = await tool.execute(input, { order: "2,1" }, {});

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(result.output[0]).toBe(0x25);
		expect(result.output[1]).toBe(0x50);
		expect(result.output[2]).toBe(0x44);
		expect(result.output[3]).toBe(0x46);
	});
});
