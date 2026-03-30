import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/page-numbers-pdf.js";

describe("page-numbers-pdf tool", () => {
	it("should be registered", () => {
		const tool = getTool("page-numbers-pdf");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("pdf");
	});

	it("should add page numbers to a 3-page PDF", async () => {
		const tool = getTool("page-numbers-pdf");
		if (!tool) throw new Error("page-numbers-pdf not registered");

		const doc = await PDFDocument.create();
		doc.addPage([612, 792]);
		doc.addPage([612, 792]);
		doc.addPage([612, 792]);
		const input = new Uint8Array(await doc.save());

		const result = await tool.execute(input, {}, {});

		expect(result.extension).toBe(".pdf");
		expect(result.mimeType).toBe("application/pdf");
		// PDF magic bytes: %PDF (25 50 44 46)
		expect(result.output[0]).toBe(0x25);
		expect(result.output[1]).toBe(0x50);
		expect(result.output[2]).toBe(0x44);
		expect(result.output[3]).toBe(0x46);
		expect(result.metadata?.pageCount).toBe(3);
	});

	it("should produce a larger file than input (font embedding)", async () => {
		const tool = getTool("page-numbers-pdf");
		if (!tool) throw new Error("page-numbers-pdf not registered");

		const doc = await PDFDocument.create();
		doc.addPage([612, 792]);
		const input = new Uint8Array(await doc.save());

		const result = await tool.execute(input, {}, {});

		expect(result.output.byteLength).toBeGreaterThan(input.byteLength);
	});

	it("should support roman numeral format", async () => {
		const tool = getTool("page-numbers-pdf");
		if (!tool) throw new Error("page-numbers-pdf not registered");

		const doc = await PDFDocument.create();
		doc.addPage([612, 792]);
		doc.addPage([612, 792]);
		const input = new Uint8Array(await doc.save());

		const result = await tool.execute(input, { format: "roman" }, {});

		expect(result.output[0]).toBe(0x25);
		expect(result.metadata?.format).toBe("roman");
		expect(result.metadata?.pageCount).toBe(2);
	});

	it("should support skip first page", async () => {
		const tool = getTool("page-numbers-pdf");
		if (!tool) throw new Error("page-numbers-pdf not registered");

		const doc = await PDFDocument.create();
		doc.addPage([612, 792]);
		doc.addPage([612, 792]);
		doc.addPage([612, 792]);
		const input = new Uint8Array(await doc.save());

		const result = await tool.execute(input, { skipFirst: true }, {});

		// Should still report all 3 pages
		expect(result.metadata?.pageCount).toBe(3);
		expect(result.output[0]).toBe(0x25);
	});

	it("should support all six positions", async () => {
		const tool = getTool("page-numbers-pdf");
		if (!tool) throw new Error("page-numbers-pdf not registered");

		const doc = await PDFDocument.create();
		doc.addPage([612, 792]);
		const input = new Uint8Array(await doc.save());

		const positions = [
			"top-left",
			"top-center",
			"top-right",
			"bottom-left",
			"bottom-center",
			"bottom-right",
		];

		for (const position of positions) {
			const result = await tool.execute(input, { position }, {});
			expect(result.output[0]).toBe(0x25);
			expect(result.metadata?.position).toBe(position);
		}
	});

	it("should throw on invalid PDF input", async () => {
		const tool = getTool("page-numbers-pdf");
		if (!tool) throw new Error("page-numbers-pdf not registered");

		await expect(
			tool.execute(new Uint8Array([1, 2, 3]), {}, {}),
		).rejects.toThrow(/Failed to load PDF/);
	});
});
