import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PICT files start with 512 bytes of resource fork padding, then QuickDraw data.
 * Most modern PICT files embed JPEG data. We test both the JPEG-embedded path
 * (with mocked createImageBitmap) and error cases.
 */

describe("decodePict", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should find and decode embedded JPEG in PICT container", async () => {
		// 512 bytes of resource fork padding + some PICT header bytes + JPEG SOI
		const padding = new Uint8Array(512);
		const pictHeader = new Uint8Array([
			0x00,
			0x0a, // picSize (fake)
			0x00,
			0x00,
			0x00,
			0x00, // bounding rect top, left
			0x00,
			0x40,
			0x00,
			0x40, // bounding rect bottom, right
		]);
		const jpegData = new Uint8Array([
			0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
		]);
		const jpegBody = new Uint8Array(50); // dummy body

		const full = new Uint8Array(
			padding.length + pictHeader.length + jpegData.length + jpegBody.length,
		);
		full.set(padding, 0);
		full.set(pictHeader, padding.length);
		full.set(jpegData, padding.length + pictHeader.length);
		full.set(jpegBody, padding.length + pictHeader.length + jpegData.length);

		// Mock browser APIs
		const fakeImageData = {
			data: new Uint8ClampedArray([0, 128, 255, 255]),
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

		const { decodePict } = await import(
			"~/features/image-tools/decoders/decode-pict"
		);
		const blob = new Blob([full], { type: "image/x-pict" });
		const result = await decodePict(blob);

		expect(result.width).toBe(1);
		expect(result.height).toBe(1);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(4);

		// Verify createImageBitmap was called to decode the embedded JPEG
		expect(bitmapCalled).toBe(true);
	});

	it("should throw when no JPEG and no PackBits found", async () => {
		// 512 bytes padding + random non-JPEG, non-opcode data
		const padding = new Uint8Array(512);
		const junk = new Uint8Array(100);
		for (let i = 0; i < junk.length; i++) junk[i] = i & 0x7f; // avoid 0xFF 0xD8 0xFF

		const full = new Uint8Array(padding.length + junk.length);
		full.set(padding, 0);
		full.set(junk, padding.length);

		const { decodePict } = await import(
			"~/features/image-tools/decoders/decode-pict"
		);
		const blob = new Blob([full], { type: "image/x-pict" });

		await expect(decodePict(blob)).rejects.toThrow("unsupported QuickDraw");
	});

	it("should reject on corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/x-pict",
		});

		const { decodePict } = await import(
			"~/features/image-tools/decoders/decode-pict"
		);

		await expect(decodePict(blob)).rejects.toThrow("too short");
	});

	it("should respect abort signal", async () => {
		const padding = new Uint8Array(524);
		const blob = new Blob([padding], { type: "image/x-pict" });
		const controller = new AbortController();
		controller.abort();

		const { decodePict } = await import(
			"~/features/image-tools/decoders/decode-pict"
		);

		await expect(decodePict(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
