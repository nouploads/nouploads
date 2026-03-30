import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/unlock-pdf.js";

/** Create a minimal valid PDF as Uint8Array. */
async function createTestPdfBytes(pageCount = 1): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		doc.addPage([612, 792]);
	}
	const bytes = await doc.save();
	return new Uint8Array(bytes);
}

describe("unlock-pdf tool", () => {
	it("should be registered", () => {
		const tool = getTool("unlock-pdf");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("pdf");
		expect(tool?.id).toBe("unlock-pdf");
	});

	it("should pass through a normal (unencrypted) PDF", async () => {
		const tool = getTool("unlock-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(2);
		const result = await tool.execute(input, {}, {});

		expect(result.extension).toBe(".pdf");
		expect(result.mimeType).toBe("application/pdf");
		expect(result.metadata?.pageCount).toBe(2);

		// Output should have PDF magic bytes: %PDF
		expect(result.output[0]).toBe(0x25);
		expect(result.output[1]).toBe(0x50);
		expect(result.output[2]).toBe(0x44);
		expect(result.output[3]).toBe(0x46);
	});

	it("should preserve page count", async () => {
		const tool = getTool("unlock-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(5);
		const result = await tool.execute(input, {}, {});

		expect(result.metadata?.pageCount).toBe(5);

		const outputDoc = await PDFDocument.load(result.output);
		expect(outputDoc.getPageCount()).toBe(5);
	});

	it("should throw on invalid input", async () => {
		const tool = getTool("unlock-pdf");
		if (!tool) throw new Error("not registered");

		const badInput = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

		await expect(tool.execute(badInput, {}, {})).rejects.toThrow(
			/Failed to load PDF/,
		);
	});

	it("should report progress", async () => {
		const tool = getTool("unlock-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(1);
		const progressValues: number[] = [];

		await tool.execute(
			input,
			{},
			{
				onProgress: (pct) => progressValues.push(pct),
			},
		);

		expect(progressValues.length).toBeGreaterThan(0);
		expect(progressValues).toContain(100);
	});
});
