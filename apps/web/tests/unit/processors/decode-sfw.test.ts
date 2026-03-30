import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * SFW is a JPEG wrapped in a proprietary container.
 * For unit testing we create a minimal blob with a JPEG-like header
 * preceded by garbage bytes — the decoder should find the JPEG start
 * and attempt to decode.
 *
 * Since createImageBitmap is not available in Vitest (Node.js),
 * we mock it to test the scanning + extraction logic.
 */

describe("decodeSfw", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should find JPEG magic bytes in wrapped data", async () => {
		// Simulate: 10 bytes of container junk, then JPEG SOI marker, then some data
		const container = new Uint8Array([
			0x53, 0x46, 0x57, 0x39, 0x34, 0x00, 0x00, 0x00, 0x01, 0x02,
		]);
		// Minimal JPEG-like data (SOI + APP0 marker)
		const jpegStart = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
		const jpegBody = new Uint8Array(20); // dummy body

		const full = new Uint8Array(
			container.length + jpegStart.length + jpegBody.length,
		);
		full.set(container, 0);
		full.set(jpegStart, container.length);
		full.set(jpegBody, container.length + jpegStart.length);

		// Mock createImageBitmap and OffscreenCanvas
		const fakeImageData = {
			data: new Uint8ClampedArray([255, 0, 0, 255]),
		};
		const fakeCtx = {
			drawImage: vi.fn(),
			getImageData: vi.fn().mockReturnValue(fakeImageData),
		};

		let bitmapCalled = false;
		vi.stubGlobal("createImageBitmap", function mockCreateImageBitmap() {
			bitmapCalled = true;
			return Promise.resolve({
				width: 1,
				height: 1,
				close: vi.fn(),
			});
		});
		vi.stubGlobal(
			"OffscreenCanvas",
			class {
				getContext() {
					return fakeCtx;
				}
			},
		);

		const { decodeSfw } = await import(
			"~/features/image-tools/decoders/decode-sfw"
		);
		const blob = new Blob([full], { type: "image/x-sfw" });
		const result = await decodeSfw(blob);

		expect(result.width).toBe(1);
		expect(result.height).toBe(1);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(4);

		// Verify createImageBitmap was called to decode the extracted JPEG
		expect(bitmapCalled).toBe(true);
	});

	it("should reject when no JPEG magic is found", async () => {
		// No 0xFF 0xD8 0xFF sequence anywhere
		const noJpeg = new Uint8Array([0x53, 0x46, 0x57, 0x00, 0x01, 0x02, 0x03]);
		const blob = new Blob([noJpeg], { type: "image/x-sfw" });

		const { decodeSfw } = await import(
			"~/features/image-tools/decoders/decode-sfw"
		);

		await expect(decodeSfw(blob)).rejects.toThrow("No embedded JPEG");
	});

	it("should reject on corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(2)], { type: "image/x-sfw" });

		const { decodeSfw } = await import(
			"~/features/image-tools/decoders/decode-sfw"
		);

		await expect(decodeSfw(blob)).rejects.toThrow();
	});

	it("should respect abort signal", async () => {
		const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
		const blob = new Blob([data], { type: "image/x-sfw" });
		const controller = new AbortController();
		controller.abort();

		const { decodeSfw } = await import(
			"~/features/image-tools/decoders/decode-sfw"
		);

		await expect(decodeSfw(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
