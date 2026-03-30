import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal synthetic 2x1 Radiance HDR file (uncompressed).
 *
 * Header: #?RADIANCE magic, FORMAT line, resolution "-Y 1 +X 2"
 * Pixels (RGBE, no RLE for widths < 8):
 *   Pixel 1: R=10, G=10, B=10, E=128 → each channel = 10 * 2^0 = 10.0
 *            Reinhard: 10/11 ≈ 0.909 → round(0.909 * 255) = 232
 *   Pixel 2: R=255, G=0, B=0, E=129 → red = 255 * 2^1 = 510.0
 *            Reinhard: 510/511 ≈ 0.998 → round(0.998 * 255) = 255
 */
function buildMinimalHdr(): Uint8Array {
	const header = new TextEncoder().encode(
		"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 1 +X 2\n",
	);
	// 2 pixels, raw RGBE (no RLE — scanline width < 8)
	const pixels = new Uint8Array([10, 10, 10, 128, 255, 0, 0, 129]);
	const hdr = new Uint8Array(header.length + pixels.length);
	hdr.set(header, 0);
	hdr.set(pixels, header.length);
	return hdr;
}

describe("decodeHdr", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a synthetic HDR file to RGBA pixels", async () => {
		const hdr = buildMinimalHdr();
		const blob = new Blob([hdr], { type: "image/vnd.radiance" });

		const { decodeHdr } = await import(
			"~/features/image-tools/decoders/decode-hdr"
		);
		const result = await decodeHdr(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(1);
		expect(result.data).toBeInstanceOf(Uint8Array);
		// RGBA = 4 bytes per pixel, 2 pixels
		expect(result.data.length).toBe(2 * 1 * 4);

		// Pixel 1: 10 * 2^(128-128) = 10.0 → Reinhard: 10/11 ≈ 0.909 → round(232)
		// All three channels should be equal and in the high range
		expect(result.data[0]).toBeGreaterThan(200);
		expect(result.data[0]).toBeLessThan(255);
		// All channels equal for pixel 1
		expect(result.data[0]).toBe(result.data[1]);
		expect(result.data[0]).toBe(result.data[2]);
		// Alpha = 255
		expect(result.data[3]).toBe(255);

		// Pixel 2: red = 255 * 2^(129-128) = 510 → Reinhard: 510/511 → ~255
		// Very bright red, tone-mapped close to max
		expect(result.data[4]).toBeGreaterThan(250);
		// Green and blue are 0
		expect(result.data[5]).toBe(0);
		expect(result.data[6]).toBe(0);
		// Alpha = 255
		expect(result.data[7]).toBe(255);
	});

	it("should reject on corrupt data", async () => {
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/vnd.radiance",
		});

		const { decodeHdr } = await import(
			"~/features/image-tools/decoders/decode-hdr"
		);

		await expect(decodeHdr(blob)).rejects.toThrow();
	});

	it("should respect abort signal", async () => {
		const hdr = buildMinimalHdr();
		const blob = new Blob([hdr], { type: "image/vnd.radiance" });
		const controller = new AbortController();
		controller.abort();

		const { decodeHdr } = await import(
			"~/features/image-tools/decoders/decode-hdr"
		);

		await expect(decodeHdr(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
