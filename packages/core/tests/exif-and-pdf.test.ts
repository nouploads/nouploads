import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { ImageBackend } from "../src/backend.js";
import { getTool } from "../src/registry.js";

// Import to trigger registrations
import "../src/tools/exif.js";
import "../src/tools/images-to-pdf.js";

const FIXTURES = join(import.meta.dirname, "../../../fixtures/images");

describe("exif-view tool", () => {
	it("should be registered", () => {
		const tool = getTool("exif-view");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("image");
	});

	it("should extract EXIF data from a JPEG as JSON", async () => {
		const tool = getTool("exif-view");
		if (!tool) throw new Error("not registered");

		const input = new Uint8Array(readFileSync(join(FIXTURES, "sample.jpg")));
		const result = await tool.execute(input, {}, {});

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");
		// Output should be valid JSON
		const json = JSON.parse(new TextDecoder().decode(result.output));
		expect(typeof json).toBe("object");
	});
});

describe("exif-strip tool", () => {
	it("should be registered", () => {
		const tool = getTool("exif-strip");
		expect(tool).toBeDefined();
	});

	it("should strip metadata via decode+encode round-trip", async () => {
		const tool = getTool("exif-strip");
		if (!tool) throw new Error("not registered");

		const mockBackend: ImageBackend = {
			decode: vi.fn().mockResolvedValue({
				width: 10,
				height: 10,
				data: new Uint8Array(400),
			}),
			encode: vi
				.fn()
				.mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
			resize: vi.fn(),
		};

		// Fake JPEG input (starts with FF D8)
		const input = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10]);
		const result = await tool.execute(input, {}, { imageBackend: mockBackend });

		expect(mockBackend.decode).toHaveBeenCalled();
		expect(mockBackend.encode).toHaveBeenCalledWith(expect.anything(), {
			format: "jpg",
			quality: 95,
		});
		expect(result.extension).toBe(".jpg");
	});

	it("should throw without backend", async () => {
		const tool = getTool("exif-strip");
		if (!tool) throw new Error("not registered");
		await expect(tool.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			"Image backend required",
		);
	});
});

describe("images-to-pdf tool", () => {
	it("should be registered with executeMulti", () => {
		const tool = getTool("images-to-pdf");
		expect(tool).toBeDefined();
		expect(tool?.executeMulti).toBeDefined();
	});

	it("should throw on single-file execute", async () => {
		const tool = getTool("images-to-pdf");
		if (!tool) throw new Error("not registered");
		await expect(tool.execute(new Uint8Array([]), {}, {})).rejects.toThrow(
			"multiple input files",
		);
	});

	it("should create a PDF from JPG and PNG images", async () => {
		const tool = getTool("images-to-pdf");
		if (!tool?.executeMulti) throw new Error("executeMulti missing");

		const jpg = new Uint8Array(readFileSync(join(FIXTURES, "sample.jpg")));
		const png = new Uint8Array(readFileSync(join(FIXTURES, "sample.png")));

		const result = await tool.executeMulti([jpg, png], {}, {});

		expect(result.extension).toBe(".pdf");
		expect(result.mimeType).toBe("application/pdf");
		// Starts with %PDF
		expect(result.output[0]).toBe(0x25);
		expect(result.output[1]).toBe(0x50);
		expect(result.output[2]).toBe(0x44);
		expect(result.output[3]).toBe(0x46);
		expect(result.metadata?.pageCount).toBe(2);
	});
});
