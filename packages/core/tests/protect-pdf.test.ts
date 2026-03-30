import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/protect-pdf.js";

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

describe("protect-pdf tool", () => {
	it("should be registered", () => {
		const tool = getTool("protect-pdf");
		expect(tool).toBeDefined();
		expect(tool?.id).toBe("protect-pdf");
		expect(tool?.category).toBe("pdf");
	});

	it("should protect a single-page PDF with user password", async () => {
		const tool = getTool("protect-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(1);
		const result = await tool.execute(input, { userPassword: "test123" }, {});

		expect(result.extension).toBe(".pdf");
		expect(result.mimeType).toBe("application/pdf");
		expect(result.output.length).toBeGreaterThan(0);
		expect(result.metadata?.pageCount).toBe(1);
		expect(result.metadata?.hasUserPassword).toBe(true);

		// Valid PDF magic bytes
		expect(result.output[0]).toBe(0x25);
		expect(result.output[1]).toBe(0x50);
		expect(result.output[2]).toBe(0x44);
		expect(result.output[3]).toBe(0x46);
	});

	it("should protect a multi-page PDF", async () => {
		const tool = getTool("protect-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(3);
		const result = await tool.execute(
			input,
			{ userPassword: "pass", ownerPassword: "admin" },
			{},
		);

		expect(result.metadata?.pageCount).toBe(3);
		expect(result.metadata?.hasUserPassword).toBe(true);
		expect(result.metadata?.hasOwnerPassword).toBe(true);
	});

	it("should include Encrypt dictionary in output", async () => {
		const tool = getTool("protect-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(1);
		const result = await tool.execute(input, { userPassword: "secret" }, {});

		// The output PDF should contain /Encrypt and /Standard
		const text = new TextDecoder("latin1").decode(result.output);
		expect(text).toContain("/Encrypt");
		expect(text).toContain("/Standard");
	});

	it("should include file ID in output", async () => {
		const tool = getTool("protect-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(1);
		const result = await tool.execute(input, { userPassword: "test" }, {});

		// The trailer should contain an ID array
		const text = new TextDecoder("latin1").decode(result.output);
		expect(text).toContain("/ID");
	});

	it("should set permission metadata correctly", async () => {
		const tool = getTool("protect-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(1);
		const result = await tool.execute(
			input,
			{
				userPassword: "test",
				allowPrinting: false,
				allowCopying: false,
				allowEditing: true,
			},
			{},
		);

		expect(result.metadata?.allowPrinting).toBe(false);
		expect(result.metadata?.allowCopying).toBe(false);
		expect(result.metadata?.allowEditing).toBe(true);
	});

	it("should throw when no password is provided", async () => {
		const tool = getTool("protect-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(1);
		await expect(
			tool.execute(input, { userPassword: "", ownerPassword: "" }, {}),
		).rejects.toThrow(/at least one password/i);
	});

	it("should throw on invalid PDF input", async () => {
		const tool = getTool("protect-pdf");
		if (!tool) throw new Error("not registered");

		const badInput = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
		await expect(
			tool.execute(badInput, { userPassword: "test" }, {}),
		).rejects.toThrow(/Failed to load PDF/);
	});

	it("should produce a larger file than original due to encryption metadata", async () => {
		const tool = getTool("protect-pdf");
		if (!tool) throw new Error("not registered");

		const input = await createTestPdfBytes(1);
		const result = await tool.execute(input, { userPassword: "test123" }, {});

		// Protected PDF should be larger due to Encrypt dict, hashes, ID
		expect(result.output.length).toBeGreaterThan(input.length);
	});
});
