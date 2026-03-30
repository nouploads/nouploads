import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("decodePsb", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a PSB file to RGBA pixels", async () => {
		const width = 4;
		const height = 2;
		const rgba = new Uint8ClampedArray(width * height * 4);
		rgba.fill(128);

		vi.doMock("@webtoon/psd", () => ({
			default: {
				parse: () => ({
					width,
					height,
					composite: async () => rgba,
				}),
			},
		}));

		const { decodePsb } = await import(
			"~/features/image-tools/decoders/decode-psb"
		);
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/vnd.adobe.photoshop-large",
		});
		const result = await decodePsb(blob);

		expect(result.width).toBe(width);
		expect(result.height).toBe(height);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(width * height * 4);
	});

	it("should reject on corrupt data", async () => {
		vi.doMock("@webtoon/psd", () => ({
			default: {
				parse: () => {
					throw new Error("Invalid PSB");
				},
			},
		}));

		const { decodePsb } = await import(
			"~/features/image-tools/decoders/decode-psb"
		);
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/vnd.adobe.photoshop-large",
		});

		await expect(decodePsb(blob)).rejects.toThrow(
			"This PSB file could not be decoded",
		);
	});

	it("should reject when composite fails", async () => {
		vi.doMock("@webtoon/psd", () => ({
			default: {
				parse: () => ({
					width: 10,
					height: 10,
					composite: async () => {
						throw new Error("Composite failed");
					},
				}),
			},
		}));

		const { decodePsb } = await import(
			"~/features/image-tools/decoders/decode-psb"
		);
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/vnd.adobe.photoshop-large",
		});

		await expect(decodePsb(blob)).rejects.toThrow(
			"This PSB file could not be composited",
		);
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodePsb } = await import(
			"~/features/image-tools/decoders/decode-psb"
		);
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/vnd.adobe.photoshop-large",
		});
		const controller = new AbortController();
		controller.abort();

		await expect(decodePsb(blob, controller.signal)).rejects.toThrow("Aborted");
	});

	it("should reject when dimensions are zero", async () => {
		vi.doMock("@webtoon/psd", () => ({
			default: {
				parse: () => ({
					width: 0,
					height: 0,
					composite: async () => new Uint8ClampedArray(0),
				}),
			},
		}));

		const { decodePsb } = await import(
			"~/features/image-tools/decoders/decode-psb"
		);
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/vnd.adobe.photoshop-large",
		});

		await expect(decodePsb(blob)).rejects.toThrow(
			"This PSB file could not be decoded",
		);
	});

	it("should reject when dimensions exceed safe browser limit", async () => {
		vi.doMock("@webtoon/psd", () => ({
			default: {
				parse: () => ({
					width: 10000,
					height: 10000,
					composite: async () => new Uint8ClampedArray(0),
				}),
			},
		}));

		const { decodePsb } = await import(
			"~/features/image-tools/decoders/decode-psb"
		);
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/vnd.adobe.photoshop-large",
		});

		await expect(decodePsb(blob)).rejects.toThrow(
			"exceeds the safe browser limit",
		);
	});
});
