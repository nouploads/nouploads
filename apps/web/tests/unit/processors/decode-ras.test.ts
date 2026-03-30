import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal 2x2 24-bit Sun Raster (type 1, raw, no colormap).
 *
 * Header: 32 bytes. Magic 0x59A66A95, width=2, height=2,
 * depth=24, length=12, type=1 (standard), maptype=0, maplength=0.
 * Pixels in BGR order. Row padding: 2*3=6 bytes per row, already even.
 */
function makeRas24bit2x2(): Uint8Array {
	const header = new ArrayBuffer(32);
	const hview = new DataView(header);

	hview.setUint32(0, 0x59a66a95, false); // magic
	hview.setUint32(4, 2, false); // width
	hview.setUint32(8, 2, false); // height
	hview.setUint32(12, 24, false); // depth
	hview.setUint32(16, 12, false); // length (2*2*3 = 12 bytes)
	hview.setUint32(20, 1, false); // type = standard
	hview.setUint32(24, 0, false); // maptype = none
	hview.setUint32(28, 0, false); // maplength = 0

	// Pixel data: BGR order
	// Row 0: red (B=0, G=0, R=255), green (B=0, G=255, R=0)
	// Row 1: blue (B=255, G=0, R=0), white (B=255, G=255, R=255)
	const pixels = new Uint8Array([
		0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255,
	]);

	const result = new Uint8Array(32 + pixels.length);
	result.set(new Uint8Array(header));
	result.set(pixels, 32);
	return result;
}

/**
 * Minimal 1x1 8-bit Sun Raster with colormap (maptype=1).
 * Pixel index 0 maps to R=10, G=20, B=30.
 * Row = 1 byte, but padded to 2 bytes (even boundary).
 */
function makeRas8bitMapped1x1(): Uint8Array {
	// Colormap: 1 entry. Planes: R plane (1 byte), G plane (1 byte), B plane (1 byte)
	const maplength = 3; // 1 entry * 3 planes
	const header = new ArrayBuffer(32);
	const hview = new DataView(header);

	hview.setUint32(0, 0x59a66a95, false);
	hview.setUint32(4, 1, false); // width
	hview.setUint32(8, 1, false); // height
	hview.setUint32(12, 8, false); // depth
	hview.setUint32(16, 2, false); // length (1 byte padded to 2)
	hview.setUint32(20, 1, false); // type = standard
	hview.setUint32(24, 1, false); // maptype = RGB
	hview.setUint32(28, maplength, false);

	// Colormap: R plane, G plane, B plane (NOT interleaved)
	const colormap = new Uint8Array([10, 20, 30]);

	// Pixel data: index 0, plus 1 padding byte
	const pixels = new Uint8Array([0, 0]);

	const result = new Uint8Array(32 + maplength + pixels.length);
	result.set(new Uint8Array(header));
	result.set(colormap, 32);
	result.set(pixels, 32 + maplength);
	return result;
}

describe("decodeRas", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 2x2 24-bit Sun Raster with BGR→RGB reorder", async () => {
		const ras = makeRas24bit2x2();
		const blob = new Blob([ras as BlobPart], { type: "image/x-sun-raster" });

		const { decodeRas } = await import(
			"~/features/image-tools/decoders/decode-ras"
		);
		const result = await decodeRas(blob);

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

		// Pixel 3: white
		expect(result.data[12]).toBe(255);
		expect(result.data[13]).toBe(255);
		expect(result.data[14]).toBe(255);
		expect(result.data[15]).toBe(255);
	});

	it("should decode an 8-bit color-mapped Sun Raster", async () => {
		const ras = makeRas8bitMapped1x1();
		const blob = new Blob([ras as BlobPart], { type: "image/x-sun-raster" });

		const { decodeRas } = await import(
			"~/features/image-tools/decoders/decode-ras"
		);
		const result = await decodeRas(blob);

		expect(result.width).toBe(1);
		expect(result.height).toBe(1);
		expect(result.data.length).toBe(4);

		// Index 0 → R=10, G=20, B=30, A=255
		expect(result.data[0]).toBe(10);
		expect(result.data[1]).toBe(20);
		expect(result.data[2]).toBe(30);
		expect(result.data[3]).toBe(255);
	});

	it("should reject on corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(10)], {
			type: "image/x-sun-raster",
		});

		const { decodeRas } = await import(
			"~/features/image-tools/decoders/decode-ras"
		);

		await expect(decodeRas(blob)).rejects.toThrow();
	});

	it("should reject on invalid magic number", async () => {
		const buf = new Uint8Array(32);
		// Wrong magic
		buf[0] = 0x00;
		const blob = new Blob([buf], { type: "image/x-sun-raster" });

		const { decodeRas } = await import(
			"~/features/image-tools/decoders/decode-ras"
		);

		await expect(decodeRas(blob)).rejects.toThrow("Invalid magic number");
	});

	it("should respect abort signal", async () => {
		const ras = makeRas24bit2x2();
		const blob = new Blob([ras as BlobPart], { type: "image/x-sun-raster" });
		const controller = new AbortController();
		controller.abort();

		const { decodeRas } = await import(
			"~/features/image-tools/decoders/decode-ras"
		);

		await expect(decodeRas(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
