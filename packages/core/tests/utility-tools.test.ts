import { describe, expect, it } from "vitest";
import { getAllTools, getTool } from "../src/registry.js";

// Import to trigger all registrations
import "../src/tools/optimize-svg.js";
import "../src/tools/merge-pdf.js";
import "../src/tools/qr-code.js";
import "../src/tools/base64.js";

describe("optimize-svg tool", () => {
	it("should be registered", () => {
		const tool = getTool("optimize-svg");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("image");
	});

	it("should optimize a simple SVG", async () => {
		const tool = getTool("optimize-svg");
		if (!tool) throw new Error("optimize-svg not registered");

		const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- This comment should be removed -->
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect x="0" y="0" width="100" height="100" fill="red"/>
</svg>`;
		const input = new TextEncoder().encode(svg);
		const result = await tool.execute(input, { multipass: true }, {});

		expect(result.extension).toBe(".svg");
		expect(result.mimeType).toBe("image/svg+xml");
		expect(result.output.byteLength).toBeLessThan(input.byteLength);
		// Should still be valid SVG
		const outputStr = new TextDecoder().decode(result.output);
		expect(outputStr).toContain("<svg");
		expect(outputStr).not.toContain("<!-- This comment");
	});
});

describe("merge-pdf tool", () => {
	it("should be registered", () => {
		const tool = getTool("merge-pdf");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("pdf");
		expect(tool?.executeMulti).toBeDefined();
	});

	it("should throw on single-file execute", async () => {
		const tool = getTool("merge-pdf");
		if (!tool) throw new Error("merge-pdf not registered");
		await expect(tool.execute(new Uint8Array([]), {}, {})).rejects.toThrow(
			"multiple input files",
		);
	});

	it("should merge two PDFs", async () => {
		const tool = getTool("merge-pdf");
		if (!tool?.executeMulti) throw new Error("merge-pdf executeMulti missing");

		// Create two minimal PDFs using pdf-lib
		const { PDFDocument } = await import("pdf-lib");
		const doc1 = await PDFDocument.create();
		doc1.addPage();
		const pdf1 = new Uint8Array(await doc1.save());

		const doc2 = await PDFDocument.create();
		doc2.addPage();
		doc2.addPage();
		const pdf2 = new Uint8Array(await doc2.save());

		const result = await tool.executeMulti([pdf1, pdf2], {}, {});

		expect(result.extension).toBe(".pdf");
		expect(result.mimeType).toBe("application/pdf");
		// Verify it's a valid PDF (starts with %PDF)
		expect(result.output[0]).toBe(0x25); // %
		expect(result.output[1]).toBe(0x50); // P
		expect(result.output[2]).toBe(0x44); // D
		expect(result.output[3]).toBe(0x46); // F
		// Should have 3 pages total
		expect(result.metadata?.pageCount).toBe(3);
	});
});

describe("qr-code-generate tool", () => {
	it("should be registered", () => {
		const tool = getTool("qr-code-generate");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("should generate a PNG QR code", async () => {
		const tool = getTool("qr-code-generate");
		if (!tool) throw new Error("qr-code-generate not registered");

		const result = await tool.execute(
			new Uint8Array([]),
			{ text: "https://nouploads.com", size: 200 },
			{},
		);

		expect(result.extension).toBe(".png");
		expect(result.mimeType).toBe("image/png");
		// PNG magic bytes
		expect(result.output[0]).toBe(0x89);
		expect(result.output[1]).toBe(0x50); // P
		expect(result.output[2]).toBe(0x4e); // N
		expect(result.output[3]).toBe(0x47); // G
		expect(result.output.byteLength).toBeGreaterThan(100);
	});

	it("should throw if no text provided", async () => {
		const tool = getTool("qr-code-generate");
		if (!tool) throw new Error("qr-code-generate not registered");
		await expect(tool.execute(new Uint8Array([]), {}, {})).rejects.toThrow(
			"No text provided",
		);
	});
});

describe("base64 tools", () => {
	it("should register both encode and decode tools", () => {
		expect(getTool("base64-encode")).toBeDefined();
		expect(getTool("base64-decode")).toBeDefined();
	});

	it("should encode bytes to base64", async () => {
		const tool = getTool("base64-encode");
		if (!tool) throw new Error("base64-encode not registered");

		const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
		const result = await tool.execute(input, {}, {});

		expect(result.extension).toBe(".txt");
		const text = new TextDecoder().decode(result.output);
		expect(text).toBe("SGVsbG8=");
	});

	it("should encode as data URI when option set", async () => {
		const tool = getTool("base64-encode");
		if (!tool) throw new Error("base64-encode not registered");

		const input = new Uint8Array([72, 101, 108, 108, 111]);
		const result = await tool.execute(
			input,
			{ dataUri: true, mimeType: "text/plain" },
			{},
		);

		const text = new TextDecoder().decode(result.output);
		expect(text).toBe("data:text/plain;base64,SGVsbG8=");
	});

	it("should round-trip encode then decode", async () => {
		const encode = getTool("base64-encode");
		const decode = getTool("base64-decode");
		if (!encode || !decode) throw new Error("tools not registered");

		const original = new Uint8Array([1, 2, 3, 255, 0, 128]);
		const encoded = await encode.execute(original, {}, {});
		const decoded = await decode.execute(encoded.output, {}, {});

		expect(decoded.output).toEqual(original);
	});

	it("should decode data URI", async () => {
		const tool = getTool("base64-decode");
		if (!tool) throw new Error("base64-decode not registered");

		const dataUri = "data:image/png;base64,iVBORw==";
		const input = new TextEncoder().encode(dataUri);
		const result = await tool.execute(input, {}, {});

		expect(result.mimeType).toBe("image/png");
		expect(result.extension).toBe(".png");
	});
});

describe("utility tools in registry", () => {
	it("should have all 5 utility tools registered", () => {
		const ids = getAllTools().map((t) => t.id);
		expect(ids).toContain("optimize-svg");
		expect(ids).toContain("merge-pdf");
		expect(ids).toContain("qr-code-generate");
		expect(ids).toContain("base64-encode");
		expect(ids).toContain("base64-decode");
	});
});
