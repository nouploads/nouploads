import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal uncompressed 2x2 true-color TGA (image type 2, 24bpp).
 * Origin is top-to-bottom (bit 5 of image_descriptor set).
 * Pixels in BGR order: red, green, blue, white.
 */
function makeTrueColor2x2(): Uint8Array {
	const header = new Uint8Array([
		0,
		0,
		2, // id_length=0, colormap_type=0, image_type=2
		0,
		0,
		0,
		0,
		0, // colormap spec (5 bytes, unused)
		0,
		0,
		0,
		0, // x_origin, y_origin (LE)
		2,
		0,
		2,
		0, // width=2, height=2 (LE)
		24, // bpp=24
		0x20, // image_descriptor: bit5=1 (top-to-bottom)
	]);
	// 4 pixels, BGR order: red=(0,0,255), green=(0,255,0), blue=(255,0,0), white=(255,255,255)
	const pixels = new Uint8Array([
		0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255,
	]);
	const tga = new Uint8Array(header.length + pixels.length);
	tga.set(header);
	tga.set(pixels, header.length);
	return tga;
}

describe("decodeTga", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 2x2 uncompressed true-color TGA to correct RGBA", async () => {
		const tga = makeTrueColor2x2();
		const blob = new Blob([tga as BlobPart], { type: "image/x-tga" });

		const { decodeTga } = await import(
			"~/features/image-tools/decoders/decode-tga"
		);
		const result = await decodeTga(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// Pixel 0: red (BGR 0,0,255 → RGBA 255,0,0,255)
		expect(result.data[0]).toBe(255);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// Pixel 1: green (BGR 0,255,0 → RGBA 0,255,0,255)
		expect(result.data[4]).toBe(0);
		expect(result.data[5]).toBe(255);
		expect(result.data[6]).toBe(0);
		expect(result.data[7]).toBe(255);

		// Pixel 2: blue (BGR 255,0,0 → RGBA 0,0,255,255)
		expect(result.data[8]).toBe(0);
		expect(result.data[9]).toBe(0);
		expect(result.data[10]).toBe(255);
		expect(result.data[11]).toBe(255);

		// Pixel 3: white (BGR 255,255,255 → RGBA 255,255,255,255)
		expect(result.data[12]).toBe(255);
		expect(result.data[13]).toBe(255);
		expect(result.data[14]).toBe(255);
		expect(result.data[15]).toBe(255);
	});

	it("should flip rows when origin is bottom-to-top", async () => {
		// Same as above but with bit 5 cleared (bottom-to-top origin)
		const header = new Uint8Array([
			0,
			0,
			2,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			2,
			0,
			2,
			0,
			24,
			0x00, // bit5=0 → bottom-to-top
		]);
		// Row 0 (stored first, but it's the bottom row): red, green
		// Row 1 (stored second, but it's the top row): blue, white
		const pixels = new Uint8Array([
			0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255,
		]);
		const tga = new Uint8Array(header.length + pixels.length);
		tga.set(header);
		tga.set(pixels, header.length);

		const blob = new Blob([tga as BlobPart], { type: "image/x-tga" });
		const { decodeTga } = await import(
			"~/features/image-tools/decoders/decode-tga"
		);
		const result = await decodeTga(blob);

		// After flip: top row should be blue, white; bottom row should be red, green
		// Pixel 0 (top-left): blue
		expect(result.data[0]).toBe(0);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(255);
		// Pixel 2 (bottom-left): red
		expect(result.data[8]).toBe(255);
		expect(result.data[9]).toBe(0);
		expect(result.data[10]).toBe(0);
	});

	it("should reject on corrupt data", async () => {
		const blob = new Blob([new Uint8Array(10)], { type: "image/x-tga" });

		const { decodeTga } = await import(
			"~/features/image-tools/decoders/decode-tga"
		);

		await expect(decodeTga(blob)).rejects.toThrow();
	});

	it("should respect abort signal", async () => {
		const tga = makeTrueColor2x2();
		const blob = new Blob([tga as BlobPart], { type: "image/x-tga" });
		const controller = new AbortController();
		controller.abort();

		const { decodeTga } = await import(
			"~/features/image-tools/decoders/decode-tga"
		);

		await expect(decodeTga(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
