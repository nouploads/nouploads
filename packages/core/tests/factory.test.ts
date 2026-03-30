import { describe, expect, it, vi } from "vitest";
import type { ImageBackend } from "../src/backend.js";
import { createImageConversionTool } from "../src/tools/factory.js";

// Reset registry between tests to avoid "already registered" errors
// We test the factory in isolation, not through the barrel import
const mockBackend: ImageBackend = {
	decode: vi.fn().mockResolvedValue({
		width: 100,
		height: 100,
		data: new Uint8Array(100 * 100 * 4),
	}),
	encode: vi.fn().mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
	resize: vi.fn(),
	transcode: vi
		.fn()
		.mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
};

describe("createImageConversionTool", () => {
	it("should create a tool with correct metadata", () => {
		const tool = createImageConversionTool({
			from: "png",
			to: "jpg",
			description: "Test conversion",
		});
		expect(tool.id).toBe("png-to-jpg");
		expect(tool.from).toBe("png");
		expect(tool.to).toBe("jpg");
		expect(tool.category).toBe("image");
		expect(tool.inputMimeTypes).toContain("image/png");
		expect(tool.inputExtensions).toContain(".png");
	});

	it("should include quality option for lossy formats", () => {
		const tool = createImageConversionTool({ from: "png", to: "webp" });
		const quality = tool.options.find((o) => o.name === "quality");
		expect(quality).toBeDefined();
		expect(quality?.default).toBe(80);
	});

	it("should not include quality option for lossless formats", () => {
		const tool = createImageConversionTool({ from: "jpg", to: "png" });
		expect(tool.options).toHaveLength(0);
	});

	it("should use transcode when available", async () => {
		const tool = createImageConversionTool({
			from: "bmp",
			to: "jpg",
		});
		const result = await tool.execute(
			new Uint8Array([1, 2, 3]),
			{ quality: 90 },
			{ imageBackend: mockBackend },
		);
		expect(mockBackend.transcode).toHaveBeenCalledWith(
			new Uint8Array([1, 2, 3]),
			"bmp",
			"jpg",
			{ format: "jpg", quality: 90 },
		);
		expect(result.extension).toBe(".jpg");
		expect(result.mimeType).toBe("image/jpeg");
	});

	it("should fall back to decode+encode when transcode is unavailable", async () => {
		const noTranscodeBackend: ImageBackend = {
			decode: vi.fn().mockResolvedValue({
				width: 10,
				height: 10,
				data: new Uint8Array(400),
			}),
			encode: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50])),
			resize: vi.fn(),
		};
		const tool = createImageConversionTool({
			from: "bmp",
			to: "png",
		});
		const result = await tool.execute(
			new Uint8Array([1]),
			{},
			{ imageBackend: noTranscodeBackend },
		);
		expect(noTranscodeBackend.decode).toHaveBeenCalled();
		expect(noTranscodeBackend.encode).toHaveBeenCalled();
		expect(result.extension).toBe(".png");
	});

	it("should throw if no image backend provided", async () => {
		const tool = createImageConversionTool({
			from: "gif",
			to: "jpg",
		});
		await expect(tool.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			"Image backend required",
		);
	});

	it("should report progress", async () => {
		const progress: number[] = [];
		const tool = createImageConversionTool({
			from: "gif",
			to: "png",
		});
		await tool.execute(
			new Uint8Array([1]),
			{},
			{
				imageBackend: mockBackend,
				onProgress: (pct) => progress.push(pct),
			},
		);
		expect(progress).toContain(10);
		expect(progress).toContain(100);
	});

	it("should throw for unknown input format", () => {
		expect(() => createImageConversionTool({ from: "xyz", to: "jpg" })).toThrow(
			"Unknown input format",
		);
	});

	it("should throw for unknown output format", () => {
		expect(() => createImageConversionTool({ from: "png", to: "xyz" })).toThrow(
			"Unknown output format",
		);
	});
});
