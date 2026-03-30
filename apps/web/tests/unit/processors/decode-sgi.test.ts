import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal 2x2 verbatim SGI with 2 channels (grayscale + alpha).
 *
 * Header: 512 bytes (magic 0x01DA, storage=0 verbatim, bpc=1,
 * dimension=3, xsize=2, ysize=2, zsize=2).
 * Data: channel 0 (4 bytes gray), channel 1 (4 bytes alpha).
 * Stored bottom-to-top, so rows are flipped on output.
 */
function makeVerbatim2x2(): Uint8Array {
	const buf = new Uint8Array(512 + 8); // header + 2 channels * 2x2 bytes

	// Magic: 0x01DA (big-endian)
	buf[0] = 0x01;
	buf[1] = 0xda;

	// Storage: 0 (verbatim)
	buf[2] = 0;

	// BPC: 1
	buf[3] = 1;

	// Dimension: 3 (big-endian uint16)
	buf[4] = 0;
	buf[5] = 3;

	// Xsize: 2 (big-endian uint16)
	buf[6] = 0;
	buf[7] = 2;

	// Ysize: 2 (big-endian uint16)
	buf[8] = 0;
	buf[9] = 2;

	// Zsize: 2 (big-endian uint16) — grayscale + alpha
	buf[10] = 0;
	buf[11] = 2;

	// Channel 0 (gray): bottom row first (row 0 stored = bottom row)
	// Row 0 (bottom): pixels 100, 150
	// Row 1 (top): pixels 200, 250
	buf[512] = 100;
	buf[513] = 150;
	buf[514] = 200;
	buf[515] = 250;

	// Channel 1 (alpha):
	// Row 0 (bottom): 128, 64
	// Row 1 (top): 255, 0
	buf[516] = 128;
	buf[517] = 64;
	buf[518] = 255;
	buf[519] = 0;

	return buf;
}

/**
 * Minimal 1x1 verbatim SGI with 3 channels (RGB).
 */
function makeRgb1x1(): Uint8Array {
	const buf = new Uint8Array(512 + 3);

	buf[0] = 0x01;
	buf[1] = 0xda;
	buf[2] = 0; // verbatim
	buf[3] = 1; // bpc=1
	buf[4] = 0;
	buf[5] = 3; // dimension=3
	buf[6] = 0;
	buf[7] = 1; // xsize=1
	buf[8] = 0;
	buf[9] = 1; // ysize=1
	buf[10] = 0;
	buf[11] = 3; // zsize=3 (RGB)

	// R=255, G=128, B=0
	buf[512] = 255; // R
	buf[513] = 128; // G
	buf[514] = 0; // B

	return buf;
}

describe("decodeSgi", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 2x2 verbatim grayscale+alpha SGI with correct flipping", async () => {
		const sgi = makeVerbatim2x2();
		const blob = new Blob([sgi as BlobPart], { type: "image/x-sgi" });

		const { decodeSgi } = await import(
			"~/features/image-tools/decoders/decode-sgi"
		);
		const result = await decodeSgi(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// After flipping: top row is stored row 1 (200, 250), bottom row is stored row 0 (100, 150)
		// Pixel (0,0) top-left: gray=200, alpha=255
		expect(result.data[0]).toBe(200); // R
		expect(result.data[1]).toBe(200); // G
		expect(result.data[2]).toBe(200); // B
		expect(result.data[3]).toBe(255); // A

		// Pixel (1,0) top-right: gray=250, alpha=0
		expect(result.data[4]).toBe(250);
		expect(result.data[5]).toBe(250);
		expect(result.data[6]).toBe(250);
		expect(result.data[7]).toBe(0);

		// Pixel (0,1) bottom-left: gray=100, alpha=128
		expect(result.data[8]).toBe(100);
		expect(result.data[9]).toBe(100);
		expect(result.data[10]).toBe(100);
		expect(result.data[11]).toBe(128);

		// Pixel (1,1) bottom-right: gray=150, alpha=64
		expect(result.data[12]).toBe(150);
		expect(result.data[13]).toBe(150);
		expect(result.data[14]).toBe(150);
		expect(result.data[15]).toBe(64);
	});

	it("should decode a 1x1 RGB SGI to correct RGBA", async () => {
		const sgi = makeRgb1x1();
		const blob = new Blob([sgi as BlobPart], { type: "image/x-sgi" });

		const { decodeSgi } = await import(
			"~/features/image-tools/decoders/decode-sgi"
		);
		const result = await decodeSgi(blob);

		expect(result.width).toBe(1);
		expect(result.height).toBe(1);
		expect(result.data.length).toBe(4);

		expect(result.data[0]).toBe(255); // R
		expect(result.data[1]).toBe(128); // G
		expect(result.data[2]).toBe(0); // B
		expect(result.data[3]).toBe(255); // A (filled)
	});

	it("should reject on corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(100)], { type: "image/x-sgi" });

		const { decodeSgi } = await import(
			"~/features/image-tools/decoders/decode-sgi"
		);

		await expect(decodeSgi(blob)).rejects.toThrow();
	});

	it("should reject on invalid magic number", async () => {
		const buf = new Uint8Array(512);
		buf[0] = 0x00;
		buf[1] = 0x00; // wrong magic
		const blob = new Blob([buf], { type: "image/x-sgi" });

		const { decodeSgi } = await import(
			"~/features/image-tools/decoders/decode-sgi"
		);

		await expect(decodeSgi(blob)).rejects.toThrow("Invalid magic number");
	});

	it("should respect abort signal", async () => {
		const sgi = makeRgb1x1();
		const blob = new Blob([sgi as BlobPart], { type: "image/x-sgi" });
		const controller = new AbortController();
		controller.abort();

		const { decodeSgi } = await import(
			"~/features/image-tools/decoders/decode-sgi"
		);

		await expect(decodeSgi(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
