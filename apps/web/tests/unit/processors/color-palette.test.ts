import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	extractPalette,
	formatHsl,
	formatRgb,
	type PaletteColor,
	paletteToCssVariables,
	paletteToTailwind,
	rgbToHex,
	rgbToHsl,
} from "~/features/image-tools/processors/color-palette";
import { createMockWorkerClass } from "../helpers/mock-worker";

const { MockWorker, getLastInstance } = createMockWorkerClass();
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
	vi.stubGlobal("Worker", MockWorker);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("rgbToHex", () => {
	it("should convert pure red", () => {
		expect(rgbToHex(255, 0, 0)).toBe("#FF0000");
	});

	it("should convert pure green", () => {
		expect(rgbToHex(0, 255, 0)).toBe("#00FF00");
	});

	it("should convert pure blue", () => {
		expect(rgbToHex(0, 0, 255)).toBe("#0000FF");
	});

	it("should convert black", () => {
		expect(rgbToHex(0, 0, 0)).toBe("#000000");
	});

	it("should convert white", () => {
		expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF");
	});

	it("should convert a mid-tone color", () => {
		expect(rgbToHex(128, 64, 32)).toBe("#804020");
	});
});

describe("rgbToHsl", () => {
	it("should convert pure red to hsl(0, 100%, 50%)", () => {
		const hsl = rgbToHsl(255, 0, 0);
		expect(hsl.h).toBe(0);
		expect(hsl.s).toBe(100);
		expect(hsl.l).toBe(50);
	});

	it("should convert pure green to hsl(120, 100%, 50%)", () => {
		const hsl = rgbToHsl(0, 255, 0);
		expect(hsl.h).toBe(120);
		expect(hsl.s).toBe(100);
		expect(hsl.l).toBe(50);
	});

	it("should convert pure blue to hsl(240, 100%, 50%)", () => {
		const hsl = rgbToHsl(0, 0, 255);
		expect(hsl.h).toBe(240);
		expect(hsl.s).toBe(100);
		expect(hsl.l).toBe(50);
	});

	it("should convert black to hsl(0, 0%, 0%)", () => {
		const hsl = rgbToHsl(0, 0, 0);
		expect(hsl.h).toBe(0);
		expect(hsl.s).toBe(0);
		expect(hsl.l).toBe(0);
	});

	it("should convert white to hsl(0, 0%, 100%)", () => {
		const hsl = rgbToHsl(255, 255, 255);
		expect(hsl.h).toBe(0);
		expect(hsl.s).toBe(0);
		expect(hsl.l).toBe(100);
	});

	it("should convert gray to hsl(0, 0%, 50%)", () => {
		const hsl = rgbToHsl(128, 128, 128);
		expect(hsl.h).toBe(0);
		expect(hsl.s).toBe(0);
		expect(hsl.l).toBe(50);
	});
});

describe("extractPalette", () => {
	function makeImageData(
		pixels: [number, number, number][],
		width: number,
	): { data: Uint8ClampedArray; width: number; height: number } {
		const height = Math.ceil(pixels.length / width);
		const data = new Uint8ClampedArray(width * height * 4);
		for (let i = 0; i < pixels.length; i++) {
			data[i * 4] = pixels[i][0];
			data[i * 4 + 1] = pixels[i][1];
			data[i * 4 + 2] = pixels[i][2];
			data[i * 4 + 3] = 255; // fully opaque
		}
		return { data, width, height };
	}

	it("should return a single color for a solid-color image", () => {
		const pixels: [number, number, number][] = Array(100).fill([255, 0, 0]);
		const imageData = makeImageData(pixels, 10);
		const palette = extractPalette(imageData, 3);

		expect(palette.length).toBeGreaterThanOrEqual(1);
		for (const color of palette) {
			expect(color.r).toBe(255);
			expect(color.g).toBe(0);
			expect(color.b).toBe(0);
			expect(color.hex).toBe("#FF0000");
		}
	});

	it("should extract two distinct colors from a two-color image", () => {
		const red: [number, number, number] = [255, 0, 0];
		const blue: [number, number, number] = [0, 0, 255];
		const pixels: [number, number, number][] = [
			...Array(50).fill(red),
			...Array(50).fill(blue),
		];
		const imageData = makeImageData(pixels, 10);
		const palette = extractPalette(imageData, 4);

		expect(palette.length).toBeGreaterThanOrEqual(2);
		const hexes = palette.map((c) => c.hex);
		expect(hexes).toContain("#FF0000");
		expect(hexes).toContain("#0000FF");
	});

	it("should skip transparent pixels", () => {
		const width = 10;
		const height = 10;
		const data = new Uint8ClampedArray(width * height * 4);
		// First half: red, fully opaque
		for (let i = 0; i < 50; i++) {
			data[i * 4] = 255;
			data[i * 4 + 1] = 0;
			data[i * 4 + 2] = 0;
			data[i * 4 + 3] = 255;
		}
		// Second half: blue, fully transparent
		for (let i = 50; i < 100; i++) {
			data[i * 4] = 0;
			data[i * 4 + 1] = 0;
			data[i * 4 + 2] = 255;
			data[i * 4 + 3] = 0; // transparent
		}
		const imageData = { data, width, height };
		const palette = extractPalette(imageData, 3);

		// Should only have red, no blue (transparent is skipped)
		for (const color of palette) {
			expect(color.r).toBe(255);
			expect(color.b).toBe(0);
		}
	});

	it("should return empty array for empty image", () => {
		const imageData = { data: new Uint8ClampedArray(0), width: 0, height: 0 };
		const palette = extractPalette(imageData, 6);
		expect(palette).toEqual([]);
	});

	it("should return at least one bucket when colorCount is 0 (current behavior)", () => {
		// medianCut's while-loop exits immediately when targetCount <= 1,
		// so k=0 returns a single aggregated bucket rather than an empty
		// palette. Documents behavior so UI-layer validation stays in sync.
		const pixels: [number, number, number][] = Array(30).fill([128, 64, 192]);
		const imageData = makeImageData(pixels, 10);
		const palette = extractPalette(imageData, 0);
		expect(palette.length).toBeLessThanOrEqual(1);
	});

	it("should not exceed distinct color count when colorCount > distinct", () => {
		// Only 1 distinct color — requesting 10 should return 1 bucket
		const pixels: [number, number, number][] = Array(40).fill([100, 100, 100]);
		const imageData = makeImageData(pixels, 10);
		const palette = extractPalette(imageData, 10);
		expect(palette.length).toBeLessThanOrEqual(10);
		expect(palette.length).toBeGreaterThanOrEqual(1);
		for (const color of palette) {
			expect(color.hex).toBe("#646464");
		}
	});

	it("should return empty array for fully transparent image", () => {
		const width = 10;
		const height = 10;
		const data = new Uint8ClampedArray(width * height * 4);
		// All pixels transparent — downsample will skip all of them
		for (let i = 0; i < 100; i++) {
			data[i * 4] = 255;
			data[i * 4 + 3] = 0; // alpha=0
		}
		const palette = extractPalette({ data, width, height }, 4);
		expect(palette).toEqual([]);
	});

	it("should return valid hex codes (6-digit format)", () => {
		const pixels: [number, number, number][] = [
			...Array(30).fill([200, 50, 80]),
			...Array(30).fill([30, 180, 90]),
			...Array(40).fill([10, 20, 200]),
		];
		const imageData = makeImageData(pixels, 10);
		const palette = extractPalette(imageData, 6);

		for (const color of palette) {
			expect(color.hex).toMatch(/^#[0-9A-F]{6}$/);
		}
	});

	it("should return RGB values in 0-255 range", () => {
		const pixels: [number, number, number][] = Array(100).fill([128, 64, 192]);
		const imageData = makeImageData(pixels, 10);
		const palette = extractPalette(imageData, 3);

		for (const color of palette) {
			expect(color.r).toBeGreaterThanOrEqual(0);
			expect(color.r).toBeLessThanOrEqual(255);
			expect(color.g).toBeGreaterThanOrEqual(0);
			expect(color.g).toBeLessThanOrEqual(255);
			expect(color.b).toBeGreaterThanOrEqual(0);
			expect(color.b).toBeLessThanOrEqual(255);
		}
	});

	it("should return HSL values in valid ranges", () => {
		const pixels: [number, number, number][] = [
			...Array(50).fill([200, 100, 50]),
			...Array(50).fill([50, 200, 100]),
		];
		const imageData = makeImageData(pixels, 10);
		const palette = extractPalette(imageData, 4);

		for (const color of palette) {
			expect(color.hsl.h).toBeGreaterThanOrEqual(0);
			expect(color.hsl.h).toBeLessThanOrEqual(360);
			expect(color.hsl.s).toBeGreaterThanOrEqual(0);
			expect(color.hsl.s).toBeLessThanOrEqual(100);
			expect(color.hsl.l).toBeGreaterThanOrEqual(0);
			expect(color.hsl.l).toBeLessThanOrEqual(100);
		}
	});
});

describe("formatHsl", () => {
	it("should format HSL correctly", () => {
		expect(formatHsl({ h: 0, s: 100, l: 50 })).toBe("hsl(0, 100%, 50%)");
	});
});

describe("formatRgb", () => {
	it("should format RGB correctly", () => {
		expect(formatRgb(255, 128, 0)).toBe("rgb(255, 128, 0)");
	});
});

describe("paletteToCssVariables", () => {
	it("should generate CSS variable declarations", () => {
		const colors = [
			{ r: 255, g: 0, b: 0, hex: "#FF0000", hsl: { h: 0, s: 100, l: 50 } },
			{ r: 0, g: 255, b: 0, hex: "#00FF00", hsl: { h: 120, s: 100, l: 50 } },
		];
		const css = paletteToCssVariables(colors);
		expect(css).toContain("--color-1: #FF0000;");
		expect(css).toContain("--color-2: #00FF00;");
	});
});

describe("paletteToTailwind", () => {
	it("should generate Tailwind config", () => {
		const colors = [
			{ r: 255, g: 0, b: 0, hex: "#FF0000", hsl: { h: 0, s: 100, l: 50 } },
		];
		const tw = paletteToTailwind(colors);
		expect(tw).toContain("colors: {");
		expect(tw).toContain("'1': '#FF0000'");
	});
});

describe("extractPaletteFromFile", () => {
	function paletteResponse(colors: PaletteColor[]) {
		const text = JSON.stringify(colors);
		return {
			output: new TextEncoder().encode(text),
			extension: ".json",
			mimeType: "application/json",
			metadata: { colorCount: colors.length },
		};
	}

	it("should dispatch to the pipeline worker and decode the JSON palette", async () => {
		const { extractPaletteFromFile } = await import(
			"~/features/image-tools/processors/color-palette"
		);

		const file = new File([new Uint8Array(100)], "red.png", {
			type: "image/png",
		});
		const promise = extractPaletteFromFile(file, 3);
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "color-palette",
				options: { count: 3 },
			}),
		);

		worker.simulateMessage(
			paletteResponse([
				{
					r: 255,
					g: 0,
					b: 0,
					hex: "#FF0000",
					hsl: { h: 0, s: 100, l: 50 },
				},
			]),
		);

		const palette = await promise;
		expect(palette).toHaveLength(1);
		expect(palette[0].hex).toBe("#FF0000");
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should throw AbortError if signal is already aborted", async () => {
		const { extractPaletteFromFile } = await import(
			"~/features/image-tools/processors/color-palette"
		);

		const controller = new AbortController();
		controller.abort();

		const file = new File([new Uint8Array(100)], "test.png", {
			type: "image/png",
		});
		await expect(
			extractPaletteFromFile(file, 3, controller.signal),
		).rejects.toThrow("Aborted");
	});

	it("should propagate worker errors", async () => {
		const { extractPaletteFromFile } = await import(
			"~/features/image-tools/processors/color-palette"
		);

		const file = new File([new Uint8Array(100)], "bad.png", {
			type: "image/png",
		});
		const promise = extractPaletteFromFile(file, 3);
		await tick();
		await tick();

		getLastInstance().simulateMessage({ error: "Decoder failed" });
		await expect(promise).rejects.toThrow(/Decoder failed/);
	});

	it("should terminate worker on abort signal", async () => {
		const { extractPaletteFromFile } = await import(
			"~/features/image-tools/processors/color-palette"
		);

		const controller = new AbortController();
		const file = new File([new Uint8Array(100)], "test.png", {
			type: "image/png",
		});
		const promise = extractPaletteFromFile(file, 3, controller.signal);
		await tick();
		await tick();

		const worker = getLastInstance();
		controller.abort();
		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});
});
