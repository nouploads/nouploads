import { describe, expect, it, vi } from "vitest";
import type { ImageBackend } from "../src/backend.js";
import { getTool } from "../src/registry.js";
import "../src/tools/heic-to-webp.js";

describe("heic-to-webp tool", () => {
	it("is registered with from=heic, to=webp", () => {
		const tool = getTool("heic-to-webp");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("image");
		expect(tool?.from).toBe("heic");
		expect(tool?.to).toBe("webp");
	});

	it("exposes a quality option", () => {
		const tool = getTool("heic-to-webp");
		expect(tool?.options.find((o) => o.name === "quality")?.default).toBe(80);
	});

	it("throws without an imageBackend", async () => {
		const tool = getTool("heic-to-webp");
		await expect(tool?.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			/Image backend/,
		);
	});

	it("uses backend.transcode when available", async () => {
		const tool = getTool("heic-to-webp");
		if (!tool) throw new Error("heic-to-webp not registered");
		const transcode = vi
			.fn()
			.mockResolvedValue(new Uint8Array([0x52, 0x49, 0x46, 0x46]));
		const backend: ImageBackend = {
			decode: vi.fn(),
			encode: vi.fn(),
			resize: vi.fn(),
			transcode,
		};
		const result = await tool.execute(
			new Uint8Array([1]),
			{ quality: 75 },
			{ imageBackend: backend },
		);
		if ("outputs" in result) throw new Error("unexpected multi-output");
		expect(transcode).toHaveBeenCalledWith(
			expect.any(Uint8Array),
			"heic",
			"webp",
			{
				format: "webp",
				quality: 75,
			},
		);
		expect(result.extension).toBe(".webp");
		expect(result.mimeType).toBe("image/webp");
	});

	it("falls back to decode+encode when transcode is absent", async () => {
		const tool = getTool("heic-to-webp");
		if (!tool) throw new Error("heic-to-webp not registered");
		const backend: ImageBackend = {
			decode: vi.fn().mockResolvedValue({
				width: 4,
				height: 4,
				data: new Uint8Array(64),
			}),
			encode: vi
				.fn()
				.mockResolvedValue(new Uint8Array([0x52, 0x49, 0x46, 0x46])),
			resize: vi.fn(),
		};
		const result = await tool.execute(
			new Uint8Array([1]),
			{ quality: 60 },
			{ imageBackend: backend },
		);
		if ("outputs" in result) throw new Error("unexpected multi-output");
		expect(backend.decode).toHaveBeenCalledWith(expect.any(Uint8Array), "heic");
		expect(backend.encode).toHaveBeenCalledWith(
			expect.objectContaining({ width: 4, height: 4 }),
			{ format: "webp", quality: 60 },
		);
		expect(result.extension).toBe(".webp");
	});
});
