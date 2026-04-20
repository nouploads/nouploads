import { describe, expect, it, vi } from "vitest";
import type { ImageBackend } from "../src/backend.js";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/image-filters.js";

function mockBackend(overrides?: Partial<ImageBackend>): ImageBackend {
	return {
		decode: vi.fn().mockResolvedValue({
			width: 4,
			height: 2,
			data: new Uint8Array([
				100, 50, 25, 255, 120, 60, 30, 255, 140, 70, 35, 255, 160, 80, 40, 255,
				180, 90, 45, 255, 200, 100, 50, 255, 220, 110, 55, 255, 240, 120, 60,
				255,
			]),
		}),
		encode: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
		resize: vi.fn(),
		crop: vi.fn(),
		...overrides,
	};
}

describe("image-filters tool", () => {
	it("should be registered", () => {
		const tool = getTool("image-filters");
		expect(tool).toBeDefined();
		expect(tool?.id).toBe("image-filters");
		expect(tool?.category).toBe("image");
	});

	it("should have all filter options", () => {
		const tool = getTool("image-filters");
		const names = tool?.options.map((o) => o.name);
		expect(names).toContain("brightness");
		expect(names).toContain("contrast");
		expect(names).toContain("saturation");
		expect(names).toContain("blur");
		expect(names).toContain("hueRotate");
		expect(names).toContain("grayscale");
		expect(names).toContain("sepia");
		expect(names).toContain("invert");
		expect(names).toContain("format");
		expect(names).toContain("quality");
	});

	it("should have correct default values", () => {
		const tool = getTool("image-filters");
		const getDefault = (name: string) =>
			tool?.options.find((o) => o.name === name)?.default;
		expect(getDefault("brightness")).toBe(100);
		expect(getDefault("contrast")).toBe(100);
		expect(getDefault("saturation")).toBe(100);
		expect(getDefault("blur")).toBe(0);
		expect(getDefault("hueRotate")).toBe(0);
		expect(getDefault("grayscale")).toBe(0);
		expect(getDefault("sepia")).toBe(0);
		expect(getDefault("invert")).toBe(0);
		expect(getDefault("format")).toBe("png");
		expect(getDefault("quality")).toBe(92);
	});

	it("should require browser capability", () => {
		const tool = getTool("image-filters");
		expect(tool?.capabilities).toContain("browser");
	});

	it("should throw when execute is called without imageBackend", async () => {
		const tool = getTool("image-filters");
		await expect(tool?.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			/Image backend/,
		);
	});

	it("should pass decoded data through encoder with format mapping", async () => {
		const tool = getTool("image-filters");
		if (!tool) throw new Error("not registered");
		const backend = mockBackend();
		const result = await tool.execute(
			new Uint8Array([0x89]),
			{ format: "jpg", quality: 70 },
			{ imageBackend: backend },
		);
		expect(backend.decode).toHaveBeenCalled();
		expect(backend.encode).toHaveBeenCalledWith(
			expect.objectContaining({ width: 4, height: 2 }),
			{ format: "jpeg", quality: 70 },
		);
		if ("extension" in result) {
			expect(result.extension).toBe(".jpg");
			expect(result.mimeType).toBe("image/jpeg");
			expect(result.metadata?.width).toBe(4);
			expect(result.metadata?.height).toBe(2);
		}
	});

	it("should produce grayscale data when grayscale=100", async () => {
		const tool = getTool("image-filters");
		if (!tool) throw new Error("not registered");
		let encodedImage: {
			width: number;
			height: number;
			data: Uint8Array;
		} | null = null;
		const backend = mockBackend({
			encode: vi.fn().mockImplementation(async (img) => {
				encodedImage = img;
				return new Uint8Array([0x89]);
			}),
		});
		await tool.execute(
			new Uint8Array([1]),
			{ grayscale: 100 },
			{ imageBackend: backend },
		);
		if (!encodedImage) throw new Error("encode was not called");
		const d = encodedImage.data;
		// After full grayscale, r ≈ g ≈ b per pixel
		for (let i = 0; i < d.length; i += 4) {
			expect(Math.abs(d[i] - d[i + 1])).toBeLessThanOrEqual(1);
			expect(Math.abs(d[i] - d[i + 2])).toBeLessThanOrEqual(1);
		}
	});

	it("should invert colors when invert=100", async () => {
		const tool = getTool("image-filters");
		if (!tool) throw new Error("not registered");
		let encodedImage: {
			width: number;
			height: number;
			data: Uint8Array;
		} | null = null;
		const backend = mockBackend({
			decode: vi.fn().mockResolvedValue({
				width: 1,
				height: 1,
				data: new Uint8Array([100, 50, 25, 255]),
			}),
			encode: vi.fn().mockImplementation(async (img) => {
				encodedImage = img;
				return new Uint8Array([0x89]);
			}),
		});
		await tool.execute(
			new Uint8Array([1]),
			{ invert: 100 },
			{ imageBackend: backend },
		);
		if (!encodedImage) throw new Error("encode was not called");
		const d = encodedImage.data;
		expect(d[0]).toBe(155); // 255 - 100
		expect(d[1]).toBe(205); // 255 - 50
		expect(d[2]).toBe(230); // 255 - 25
	});
});
