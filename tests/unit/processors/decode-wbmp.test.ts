import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal 2x2 WBMP image.
 * Type=0, FixedHeader=0, Width=2, Height=2
 * Pixel data: 0xC0 (bits 1100 0000) per row
 * Bit 1 = black (0,0,0), Bit 0 = white (255,255,255)
 * Row 0: black, black, (padding bits 0)
 * Row 1: black, black, (padding bits 0)
 */
function makeWbmp2x2(): Uint8Array {
	return new Uint8Array([
		0x00, // type = 0
		0x00, // fixed header = 0
		0x02, // width = 2 (single-byte, bit 7 clear)
		0x02, // height = 2
		0xc0, // row 0: bits 1100 0000 → black, black
		0xc0, // row 1: bits 1100 0000 → black, black
	]);
}

/**
 * 4x1 WBMP: type=0, width=4, height=1
 * Pixels: 0xA0 = bits 1010 0000 → black, white, black, white
 */
function makeWbmp4x1Mixed(): Uint8Array {
	return new Uint8Array([
		0x00, // type = 0
		0x00, // fixed header = 0
		0x04, // width = 4
		0x01, // height = 1
		0xa0, // bits 1010 0000 → black, white, black, white
	]);
}

describe("decodeWbmp", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 2x2 WBMP with all black pixels", async () => {
		const wbmp = makeWbmp2x2();
		const blob = new Blob([wbmp], { type: "image/vnd.wap.wbmp" });

		const { decodeWbmp } = await import(
			"~/features/image-tools/decoders/decode-wbmp"
		);
		const result = await decodeWbmp(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// All pixels should be black (bit 1 = black)
		for (let i = 0; i < 4; i++) {
			const off = i * 4;
			expect(result.data[off]).toBe(0); // R
			expect(result.data[off + 1]).toBe(0); // G
			expect(result.data[off + 2]).toBe(0); // B
			expect(result.data[off + 3]).toBe(255); // A
		}
	});

	it("should decode mixed black and white pixels correctly", async () => {
		const wbmp = makeWbmp4x1Mixed();
		const blob = new Blob([wbmp], { type: "image/vnd.wap.wbmp" });

		const { decodeWbmp } = await import(
			"~/features/image-tools/decoders/decode-wbmp"
		);
		const result = await decodeWbmp(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(1);
		expect(result.data.length).toBe(4 * 1 * 4);

		// Pixel 0: black (bit 1)
		expect(result.data[0]).toBe(0);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// Pixel 1: white (bit 0)
		expect(result.data[4]).toBe(255);
		expect(result.data[5]).toBe(255);
		expect(result.data[6]).toBe(255);
		expect(result.data[7]).toBe(255);

		// Pixel 2: black (bit 1)
		expect(result.data[8]).toBe(0);
		expect(result.data[9]).toBe(0);
		expect(result.data[10]).toBe(0);
		expect(result.data[11]).toBe(255);

		// Pixel 3: white (bit 0)
		expect(result.data[12]).toBe(255);
		expect(result.data[13]).toBe(255);
		expect(result.data[14]).toBe(255);
		expect(result.data[15]).toBe(255);
	});

	it("should reject on corrupt data", async () => {
		const blob = new Blob([new Uint8Array(2)], {
			type: "image/vnd.wap.wbmp",
		});

		const { decodeWbmp } = await import(
			"~/features/image-tools/decoders/decode-wbmp"
		);

		await expect(decodeWbmp(blob)).rejects.toThrow();
	});

	it("should reject on unsupported type byte", async () => {
		// Type byte = 1 (unsupported)
		const blob = new Blob(
			[new Uint8Array([0x01, 0x00, 0x02, 0x02, 0xc0, 0xc0])],
			{
				type: "image/vnd.wap.wbmp",
			},
		);

		const { decodeWbmp } = await import(
			"~/features/image-tools/decoders/decode-wbmp"
		);

		await expect(decodeWbmp(blob)).rejects.toThrow("unsupported type");
	});

	it("should respect abort signal", async () => {
		const wbmp = makeWbmp2x2();
		const blob = new Blob([wbmp], { type: "image/vnd.wap.wbmp" });
		const controller = new AbortController();
		controller.abort();

		const { decodeWbmp } = await import(
			"~/features/image-tools/decoders/decode-wbmp"
		);

		await expect(decodeWbmp(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
