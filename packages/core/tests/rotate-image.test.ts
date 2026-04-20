import { describe, expect, it, vi } from "vitest";
import type { ImageBackend } from "../src/backend.js";
import { getTool } from "../src/registry.js";
import "../src/tools/rotate-image.js";

function mockBackend(overrides: Partial<ImageBackend> = {}): ImageBackend {
	return {
		decode: vi.fn().mockResolvedValue({
			width: 40,
			height: 20,
			data: new Uint8Array(40 * 20 * 4),
		}),
		encode: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
		resize: vi.fn(),
		crop: vi.fn(),
		...overrides,
	};
}

describe("rotate-image tool", () => {
	it("is registered under image category", () => {
		const tool = getTool("rotate-image");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("image");
	});

	it("lists every supported action", () => {
		const tool = getTool("rotate-image");
		const action = tool?.options.find((o) => o.name === "action");
		expect(action?.choices).toEqual([
			"rotate-cw",
			"rotate-ccw",
			"rotate-180",
			"flip-h",
			"flip-v",
		]);
	});

	it("throws without imageBackend", async () => {
		const tool = getTool("rotate-image");
		await expect(tool?.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			/Image backend/,
		);
	});

	it("swaps width/height for rotate-cw and re-encodes via backend", async () => {
		const tool = getTool("rotate-image");
		if (!tool) throw new Error("rotate-image not registered");

		const backend = mockBackend();
		const result = await tool.execute(
			new Uint8Array([1]),
			{ action: "rotate-cw", format: "png" },
			{ imageBackend: backend },
		);

		expect(backend.decode).toHaveBeenCalled();
		expect(backend.encode).toHaveBeenCalled();
		if ("extension" in result) {
			expect(result.extension).toBe(".png");
			// 90° rotation swaps width and height (originally 40x20).
			expect(result.metadata?.newWidth).toBe(20);
			expect(result.metadata?.newHeight).toBe(40);
			expect(result.metadata?.action).toBe("rotate-cw");
		}
	});

	it("preserves dimensions for flip-h", async () => {
		const tool = getTool("rotate-image");
		if (!tool) throw new Error("rotate-image not registered");
		const backend = mockBackend();
		const result = await tool.execute(
			new Uint8Array([1]),
			{ action: "flip-h" },
			{ imageBackend: backend },
		);
		if ("extension" in result) {
			expect(result.metadata?.newWidth).toBe(40);
			expect(result.metadata?.newHeight).toBe(20);
			expect(result.metadata?.action).toBe("flip-h");
		}
	});

	it("honours the format option (jpg → image/jpeg)", async () => {
		const tool = getTool("rotate-image");
		if (!tool) throw new Error("rotate-image not registered");
		const backend = mockBackend();
		const result = await tool.execute(
			new Uint8Array([1]),
			{ action: "rotate-180", format: "jpg", quality: 70 },
			{ imageBackend: backend },
		);
		expect(backend.encode).toHaveBeenCalledWith(
			expect.objectContaining({ width: 40, height: 20 }),
			{ format: "jpg", quality: 70 },
		);
		if ("extension" in result) {
			expect(result.extension).toBe(".jpg");
			expect(result.mimeType).toBe("image/jpeg");
		}
	});
});
