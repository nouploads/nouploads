import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import "../src/tools/pdf-to-text.js";

/**
 * pdf-to-text is browser-only (pdfjs-dist requires DOMMatrix). The
 * core tool's execute() throws in Node — this test makes sure the
 * registration + capability declaration + error message stay coherent.
 */
describe("pdf-to-text tool (core stub)", () => {
	it("is registered under pdf category", () => {
		const tool = getTool("pdf-to-text");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("pdf");
	});

	it('declares "browser" capability', () => {
		expect(getTool("pdf-to-text")?.capabilities).toContain("browser");
	});

	it("throws on Node execute() pointing at the web app", async () => {
		const tool = getTool("pdf-to-text");
		if (!tool) throw new Error("pdf-to-text not registered");
		await expect(
			tool.execute(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {}, {}),
		).rejects.toThrow(/browser environment/);
	});
});
