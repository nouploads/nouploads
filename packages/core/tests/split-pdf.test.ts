import { PDFDocument } from "pdf-lib";
import { beforeAll, describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import { isToolResultMulti } from "../src/tool.js";
import "../src/tools/split-pdf.js";

async function makePdf(pageCount: number): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) doc.addPage([200, 300]);
	return doc.save();
}

describe("split-pdf tool", () => {
	let pdf3: Uint8Array;
	let pdf5: Uint8Array;

	beforeAll(async () => {
		pdf3 = await makePdf(3);
		pdf5 = await makePdf(5);
	});

	it("is registered with a ranges option", () => {
		const tool = getTool("split-pdf");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("pdf");
		expect(tool?.options.find((o) => o.name === "ranges")).toBeDefined();
	});

	it("splits a 3-page PDF into 3 single-page outputs by default", async () => {
		const tool = getTool("split-pdf");
		if (!tool) throw new Error("split-pdf not registered");
		const result = await tool.execute(pdf3, { ranges: "" }, {});
		if (!isToolResultMulti(result)) {
			throw new Error("split-pdf should return ToolResultMulti");
		}
		expect(result.outputs).toHaveLength(3);
		for (const out of result.outputs) {
			expect(out.mimeType).toBe("application/pdf");
			expect(out.filename).toMatch(/\.pdf$/);
			expect(out.bytes[0]).toBe(0x25); // %PDF
		}
	});

	it("splits a 5-page PDF into the requested ranges", async () => {
		const tool = getTool("split-pdf");
		if (!tool) throw new Error("split-pdf not registered");
		const result = await tool.execute(pdf5, { ranges: "1-2, 4-5" }, {});
		if (!isToolResultMulti(result)) {
			throw new Error("split-pdf should return ToolResultMulti");
		}
		expect(result.outputs).toHaveLength(2);
		for (const out of result.outputs) {
			const sub = await PDFDocument.load(out.bytes);
			expect(sub.getPageCount()).toBe(2);
		}
	});

	it("returns a single ToolResult when exactly one range is requested", async () => {
		const tool = getTool("split-pdf");
		if (!tool) throw new Error("split-pdf not registered");
		const result = await tool.execute(pdf5, { ranges: "1-3" }, {});
		if (isToolResultMulti(result)) {
			throw new Error("single-range should collapse to ToolResult");
		}
		expect(result.mimeType).toBe("application/pdf");
		expect(result.output[0]).toBe(0x25); // %PDF
		const sub = await PDFDocument.load(result.output);
		expect(sub.getPageCount()).toBe(3);
	});

	it("throws on empty input", async () => {
		const tool = getTool("split-pdf");
		if (!tool) throw new Error("split-pdf not registered");
		await expect(
			tool.execute(new Uint8Array(), { ranges: "" }, {}),
		).rejects.toThrow(/No file/);
	});

	it("throws on a corrupt PDF", async () => {
		const tool = getTool("split-pdf");
		if (!tool) throw new Error("split-pdf not registered");
		await expect(
			tool.execute(new Uint8Array([0, 1, 2, 3]), { ranges: "" }, {}),
		).rejects.toThrow(/Failed to load PDF/);
	});
});
