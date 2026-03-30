import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal 2x2 XBM image as C source text.
 *
 * Byte layout per row (LSB first, padded to byte boundary):
 *   Byte 0x05 = 0b00000101 → bits: pixel0=1(black), pixel1=0(white), rest padding
 *   Byte 0x0A = 0b00001010 → bits: pixel0=0(white), pixel1=1(black), rest padding
 *
 * Result: checkerboard — (0,0)=black, (1,0)=white, (0,1)=white, (1,1)=black
 */
function makeXbm2x2(): string {
	return [
		"#define test_width 2",
		"#define test_height 2",
		"static unsigned char test_bits[] = { 0x01, 0x02 };",
	].join("\n");
}

/**
 * 4x1 XBM: one row of 4 pixels.
 * Byte 0x0A = 0b00001010 → bits: p0=0(white), p1=1(black), p2=0(white), p3=1(black)
 */
function makeXbm4x1(): string {
	return [
		"#define icon_width 4",
		"#define icon_height 1",
		"static unsigned char icon_bits[] = { 0x0A };",
	].join("\n");
}

describe("decodeXbm", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 2x2 XBM checkerboard", async () => {
		const text = makeXbm2x2();
		const blob = new Blob([text], { type: "image/x-xbitmap" });

		const { decodeXbm } = await import(
			"~/features/image-tools/decoders/decode-xbm"
		);
		const result = await decodeXbm(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// Row 0: 0x01 = 0b00000001 → pixel0=bit0=1(black), pixel1=bit1=0(white)
		// (0,0) = black
		expect(result.data[0]).toBe(0);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// (1,0) = white
		expect(result.data[4]).toBe(255);
		expect(result.data[5]).toBe(255);
		expect(result.data[6]).toBe(255);
		expect(result.data[7]).toBe(255);

		// Row 1: 0x02 = 0b00000010 → pixel0=bit0=0(white), pixel1=bit1=1(black)
		// (0,1) = white
		expect(result.data[8]).toBe(255);
		expect(result.data[9]).toBe(255);
		expect(result.data[10]).toBe(255);
		expect(result.data[11]).toBe(255);

		// (1,1) = black
		expect(result.data[12]).toBe(0);
		expect(result.data[13]).toBe(0);
		expect(result.data[14]).toBe(0);
		expect(result.data[15]).toBe(255);
	});

	it("should decode a 4x1 XBM with mixed pixels", async () => {
		const text = makeXbm4x1();
		const blob = new Blob([text], { type: "image/x-xbitmap" });

		const { decodeXbm } = await import(
			"~/features/image-tools/decoders/decode-xbm"
		);
		const result = await decodeXbm(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(1);
		expect(result.data.length).toBe(4 * 1 * 4);

		// 0x0A = 0b00001010 → LSB first: p0=0(white), p1=1(black), p2=0(white), p3=1(black)
		expect(result.data[0]).toBe(255); // pixel 0: white
		expect(result.data[4]).toBe(0); // pixel 1: black
		expect(result.data[8]).toBe(255); // pixel 2: white
		expect(result.data[12]).toBe(0); // pixel 3: black
	});

	it("should reject on missing width/height", async () => {
		const text = "static unsigned char bits[] = { 0x00 };";
		const blob = new Blob([text], { type: "image/x-xbitmap" });

		const { decodeXbm } = await import(
			"~/features/image-tools/decoders/decode-xbm"
		);

		await expect(decodeXbm(blob)).rejects.toThrow("Missing width or height");
	});

	it("should reject on truncated pixel data", async () => {
		const text = [
			"#define t_width 100",
			"#define t_height 100",
			"static unsigned char t_bits[] = { 0x00 };",
		].join("\n");
		const blob = new Blob([text], { type: "image/x-xbitmap" });

		const { decodeXbm } = await import(
			"~/features/image-tools/decoders/decode-xbm"
		);

		await expect(decodeXbm(blob)).rejects.toThrow("truncated");
	});

	it("should respect abort signal", async () => {
		const text = makeXbm2x2();
		const blob = new Blob([text], { type: "image/x-xbitmap" });
		const controller = new AbortController();
		controller.abort();

		const { decodeXbm } = await import(
			"~/features/image-tools/decoders/decode-xbm"
		);

		await expect(decodeXbm(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
