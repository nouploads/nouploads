import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal 2x2 24-bit PCX (3 planes, 8bpp, RLE encoded).
 * All pixel values are below 0xC0 so they encode as literal bytes.
 *
 * Scanline layout: 3 planes * bytesPerLine(2) = 6 bytes per row.
 * Row 0: R=[0x10, 0x20], G=[0x30, 0x40], B=[0x50, 0x60]
 * Row 1: R=[0x70, 0x80], G=[0x90, 0xA0], B=[0x11, 0x22]
 */
function make24bit2x2(): Uint8Array {
	const header = new Uint8Array(128);
	header[0] = 0x0a; // manufacturer
	header[1] = 5; // version
	header[2] = 1; // encoding = RLE
	header[3] = 8; // bpp per plane

	// xMin=0, yMin=0 (bytes 4-7, little-endian, already 0)
	// xMax=1 (bytes 8-9)
	header[8] = 1;
	header[9] = 0;
	// yMax=1 (bytes 10-11)
	header[10] = 1;
	header[11] = 0;

	header[65] = 3; // nPlanes
	// bytesPerLine=2 (bytes 66-67)
	header[66] = 2;
	header[67] = 0;

	// Pixel data: all literal bytes (< 0xC0), no RLE runs needed
	// Row 0: R plane [0x10, 0x20], G plane [0x30, 0x40], B plane [0x50, 0x60]
	// Row 1: R plane [0x70, 0x80], G plane [0x90, 0xA0], B plane [0x11, 0x22]
	const pixels = new Uint8Array([
		0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90, 0xa0, 0x11, 0x22,
	]);

	const pcx = new Uint8Array(header.length + pixels.length);
	pcx.set(header);
	pcx.set(pixels, header.length);
	return pcx;
}

describe("decodePcx", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 2x2 24-bit PCX to correct RGBA pixels", async () => {
		const pcx = make24bit2x2();
		const blob = new Blob([pcx as BlobPart], { type: "image/x-pcx" });

		const { decodePcx } = await import(
			"~/features/image-tools/decoders/decode-pcx"
		);
		const result = await decodePcx(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// Pixel (0,0): R=0x10, G=0x30, B=0x50, A=255
		expect(result.data[0]).toBe(0x10);
		expect(result.data[1]).toBe(0x30);
		expect(result.data[2]).toBe(0x50);
		expect(result.data[3]).toBe(255);

		// Pixel (1,0): R=0x20, G=0x40, B=0x60, A=255
		expect(result.data[4]).toBe(0x20);
		expect(result.data[5]).toBe(0x40);
		expect(result.data[6]).toBe(0x60);
		expect(result.data[7]).toBe(255);

		// Pixel (0,1): R=0x70, G=0x90, B=0x11, A=255
		expect(result.data[8]).toBe(0x70);
		expect(result.data[9]).toBe(0x90);
		expect(result.data[10]).toBe(0x11);
		expect(result.data[11]).toBe(255);

		// Pixel (1,1): R=0x80, G=0xA0, B=0x22, A=255
		expect(result.data[12]).toBe(0x80);
		expect(result.data[13]).toBe(0xa0);
		expect(result.data[14]).toBe(0x22);
		expect(result.data[15]).toBe(255);
	});

	it("should reject corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(10)], { type: "image/x-pcx" });

		const { decodePcx } = await import(
			"~/features/image-tools/decoders/decode-pcx"
		);

		await expect(decodePcx(blob)).rejects.toThrow();
	});

	it("should reject invalid manufacturer byte", async () => {
		const buf = new Uint8Array(128);
		buf[0] = 0x00; // wrong manufacturer (should be 0x0A)

		const blob = new Blob([buf], { type: "image/x-pcx" });

		const { decodePcx } = await import(
			"~/features/image-tools/decoders/decode-pcx"
		);

		await expect(decodePcx(blob)).rejects.toThrow("Invalid manufacturer byte");
	});

	it("should respect abort signal", async () => {
		const pcx = make24bit2x2();
		const blob = new Blob([pcx as BlobPart], { type: "image/x-pcx" });
		const controller = new AbortController();
		controller.abort();

		const { decodePcx } = await import(
			"~/features/image-tools/decoders/decode-pcx"
		);

		await expect(decodePcx(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
