import { describe, expect, it, vi } from "vitest";
import type { ImageBackend } from "../src/backend.js";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/color-palette.js";

describe("color-palette tool", () => {
	it("should be registered", () => {
		const tool = getTool("color-palette");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("image");
		expect(tool?.capabilities).toContain("browser");
	});

	it("should have correct metadata", () => {
		const tool = getTool("color-palette");
		expect(tool?.name).toBe("Color Palette Extractor");
		expect(tool?.options).toHaveLength(1);
		expect(tool?.options[0].name).toBe("count");
		expect(tool?.options[0].default).toBe(6);
	});

	it("should throw without image backend", async () => {
		const tool = getTool("color-palette");
		if (!tool) throw new Error("not registered");
		await expect(tool.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			"Image backend required",
		);
	});

	it("should extract colors from a solid-color image", async () => {
		const tool = getTool("color-palette");
		if (!tool) throw new Error("not registered");

		// Create a mock 10x10 solid red image
		const width = 10;
		const height = 10;
		const data = new Uint8Array(width * height * 4);
		for (let i = 0; i < width * height; i++) {
			data[i * 4] = 255; // R
			data[i * 4 + 1] = 0; // G
			data[i * 4 + 2] = 0; // B
			data[i * 4 + 3] = 255; // A
		}

		const mockBackend: ImageBackend = {
			decode: vi.fn().mockResolvedValue({ width, height, data }),
			encode: vi.fn(),
			resize: vi.fn(),
		};

		const result = await tool.execute(
			new Uint8Array([0xff, 0xd8]),
			{ count: 3 },
			{ imageBackend: mockBackend },
		);

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");

		const colors = JSON.parse(new TextDecoder().decode(result.output));
		expect(Array.isArray(colors)).toBe(true);
		expect(colors.length).toBeGreaterThanOrEqual(1);
		// All colors should be red-ish since input is solid red
		for (const color of colors) {
			expect(color.r).toBe(255);
			expect(color.g).toBe(0);
			expect(color.b).toBe(0);
			expect(color.hex).toBe("#FF0000");
		}
	});

	it("should extract multiple colors from a two-color image", async () => {
		const tool = getTool("color-palette");
		if (!tool) throw new Error("not registered");

		// Create a 10x10 image: top half red, bottom half blue
		const width = 10;
		const height = 10;
		const data = new Uint8Array(width * height * 4);
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const i = (y * width + x) * 4;
				if (y < 5) {
					data[i] = 255; // R
					data[i + 1] = 0;
					data[i + 2] = 0;
				} else {
					data[i] = 0;
					data[i + 1] = 0;
					data[i + 2] = 255; // B
				}
				data[i + 3] = 255; // A
			}
		}

		const mockBackend: ImageBackend = {
			decode: vi.fn().mockResolvedValue({ width, height, data }),
			encode: vi.fn(),
			resize: vi.fn(),
		};

		const result = await tool.execute(
			new Uint8Array([0xff, 0xd8]),
			{ count: 3 },
			{ imageBackend: mockBackend },
		);

		const colors = JSON.parse(new TextDecoder().decode(result.output));
		expect(colors.length).toBeGreaterThanOrEqual(2);

		const hexes = colors.map((c: { hex: string }) => c.hex);
		expect(hexes).toContain("#FF0000");
		expect(hexes).toContain("#0000FF");
	});
});
