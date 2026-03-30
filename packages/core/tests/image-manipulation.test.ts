import { describe, expect, it, vi } from "vitest";
import type { ImageBackend } from "../src/backend.js";
import { getTool } from "../src/registry.js";

// Import to trigger registrations
import "../src/tools/compress-image.js";
import "../src/tools/crop-image.js";
import "../src/tools/resize-image.js";

function mockBackend(overrides?: Partial<ImageBackend>): ImageBackend {
	return {
		decode: vi.fn().mockResolvedValue({
			width: 200,
			height: 100,
			data: new Uint8Array(200 * 100 * 4),
		}),
		encode: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50, 0x4e])),
		resize: vi.fn().mockResolvedValue({
			width: 100,
			height: 50,
			data: new Uint8Array(100 * 50 * 4),
		}),
		transcode: vi.fn().mockResolvedValue(new Uint8Array([0xff, 0xd8])),
		crop: vi.fn().mockResolvedValue({
			width: 50,
			height: 50,
			data: new Uint8Array(50 * 50 * 4),
		}),
		quantize: vi.fn().mockResolvedValue({
			width: 200,
			height: 100,
			data: new Uint8Array(200 * 100 * 4),
		}),
		...overrides,
	};
}

describe("compress-jpg tool", () => {
	it("should be registered", () => {
		const tool = getTool("compress-jpg");
		expect(tool).toBeDefined();
		expect(tool?.options.find((o) => o.name === "quality")?.default).toBe(60);
	});

	it("should use transcode for compression", async () => {
		const tool = getTool("compress-jpg");
		if (!tool) throw new Error("not registered");
		const backend = mockBackend();
		await tool.execute(
			new Uint8Array([1]),
			{ quality: 50 },
			{ imageBackend: backend },
		);
		expect(backend.transcode).toHaveBeenCalledWith(
			new Uint8Array([1]),
			"jpeg",
			"jpeg",
			{ format: "jpeg", quality: 50 },
		);
	});

	it("should throw without backend", async () => {
		const tool = getTool("compress-jpg");
		if (!tool) throw new Error("not registered");
		await expect(tool.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			"Image backend required",
		);
	});
});

describe("compress-webp tool", () => {
	it("should be registered", () => {
		expect(getTool("compress-webp")).toBeDefined();
	});
});

describe("compress-png tool", () => {
	it("should be registered with colors option", () => {
		const tool = getTool("compress-png");
		expect(tool).toBeDefined();
		expect(tool?.options.find((o) => o.name === "colors")?.default).toBe(256);
	});

	it("should use quantize when available", async () => {
		const tool = getTool("compress-png");
		if (!tool) throw new Error("not registered");
		const backend = mockBackend();
		await tool.execute(
			new Uint8Array([1]),
			{ colors: 128 },
			{ imageBackend: backend },
		);
		expect(backend.quantize).toHaveBeenCalledWith(expect.anything(), 128);
		expect(backend.encode).toHaveBeenCalled();
	});

	it("should skip quantize when not available", async () => {
		const tool = getTool("compress-png");
		if (!tool) throw new Error("not registered");
		const backend = mockBackend({ quantize: undefined });
		await tool.execute(new Uint8Array([1]), {}, { imageBackend: backend });
		expect(backend.decode).toHaveBeenCalled();
		expect(backend.encode).toHaveBeenCalled();
	});
});

describe("resize-image tool", () => {
	it("should be registered", () => {
		const tool = getTool("resize-image");
		expect(tool).toBeDefined();
	});

	it("should resize via backend", async () => {
		const tool = getTool("resize-image");
		if (!tool) throw new Error("not registered");
		const backend = mockBackend();
		const result = await tool.execute(
			new Uint8Array([1]),
			{ width: 100, format: "png" },
			{ imageBackend: backend },
		);
		expect(backend.decode).toHaveBeenCalled();
		expect(backend.resize).toHaveBeenCalledWith(expect.anything(), {
			width: 100,
			height: undefined,
			fit: "inside",
		});
		expect(result.extension).toBe(".png");
	});

	it("should throw if no dimensions given", async () => {
		const tool = getTool("resize-image");
		if (!tool) throw new Error("not registered");
		await expect(
			tool.execute(new Uint8Array([1]), {}, { imageBackend: mockBackend() }),
		).rejects.toThrow("--width or --height");
	});
});

describe("crop-image tool", () => {
	it("should be registered", () => {
		const tool = getTool("crop-image");
		expect(tool).toBeDefined();
	});

	it("should crop via backend.crop", async () => {
		const tool = getTool("crop-image");
		if (!tool) throw new Error("not registered");
		const backend = mockBackend();
		const result = await tool.execute(
			new Uint8Array([1]),
			{ x: 10, y: 10, width: 50, height: 50, format: "jpg", quality: 90 },
			{ imageBackend: backend },
		);
		expect(backend.crop).toHaveBeenCalledWith(expect.anything(), {
			x: 10,
			y: 10,
			width: 50,
			height: 50,
		});
		expect(result.extension).toBe(".jpg");
	});

	it("should use pixel fallback when crop not available", async () => {
		const tool = getTool("crop-image");
		if (!tool) throw new Error("not registered");
		const backend = mockBackend({ crop: undefined });
		const result = await tool.execute(
			new Uint8Array([1]),
			{ x: 0, y: 0, width: 10, height: 10 },
			{ imageBackend: backend },
		);
		expect(backend.encode).toHaveBeenCalled();
		expect(result.extension).toBe(".png");
	});

	it("should throw if crop region exceeds image", async () => {
		const tool = getTool("crop-image");
		if (!tool) throw new Error("not registered");
		await expect(
			tool.execute(
				new Uint8Array([1]),
				{ x: 0, y: 0, width: 999, height: 999 },
				{ imageBackend: mockBackend() },
			),
		).rejects.toThrow("exceeds image dimensions");
	});

	it("should throw if width/height missing", async () => {
		const tool = getTool("crop-image");
		if (!tool) throw new Error("not registered");
		await expect(
			tool.execute(new Uint8Array([1]), {}, { imageBackend: mockBackend() }),
		).rejects.toThrow("--width and --height are required");
	});
});
