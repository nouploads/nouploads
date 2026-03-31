import { describe, expect, it, vi } from "vitest";
import type { ImageBackend } from "../src/backend.js";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/strip-metadata.js";

describe("strip-metadata tool", () => {
	it("should be registered", () => {
		const tool = getTool("strip-metadata");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("image");
		expect(tool?.name).toBe("EXIF Metadata Remover");
	});

	it("should have quality option", () => {
		const tool = getTool("strip-metadata");
		expect(tool?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "quality",
					type: "number",
					default: 92,
				}),
			]),
		);
	});

	it("should strip metadata via decode+encode round-trip", async () => {
		const tool = getTool("strip-metadata");
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
			quality: 92,
		});
		expect(result.extension).toBe(".jpg");
		expect(result.mimeType).toBe("image/jpeg");
	});

	it("should detect PNG input format", async () => {
		const tool = getTool("strip-metadata");
		if (!tool) throw new Error("not registered");

		const mockBackend: ImageBackend = {
			decode: vi.fn().mockResolvedValue({
				width: 10,
				height: 10,
				data: new Uint8Array(400),
			}),
			encode: vi
				.fn()
				.mockResolvedValue(
					new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]),
				),
			resize: vi.fn(),
		};

		// Fake PNG input (starts with 89 50)
		const input = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
		const result = await tool.execute(input, {}, { imageBackend: mockBackend });

		expect(mockBackend.encode).toHaveBeenCalledWith(expect.anything(), {
			format: "png",
			quality: 92,
		});
		expect(result.extension).toBe(".png");
		expect(result.mimeType).toBe("image/png");
	});

	it("should use custom quality option", async () => {
		const tool = getTool("strip-metadata");
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

		const input = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10]);
		await tool.execute(input, { quality: 80 }, { imageBackend: mockBackend });

		expect(mockBackend.encode).toHaveBeenCalledWith(expect.anything(), {
			format: "jpg",
			quality: 80,
		});
	});

	it("should throw without backend", async () => {
		const tool = getTool("strip-metadata");
		if (!tool) throw new Error("not registered");
		await expect(tool.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			"Image backend required",
		);
	});
});
