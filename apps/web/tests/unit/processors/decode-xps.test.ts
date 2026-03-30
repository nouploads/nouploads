import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Helper: build a mock JSZip instance with the given file entries.
 * Each entry has a path, byte data, and optional uncompressed size.
 */
function makeMockZip(
	entries: { path: string; data: Uint8Array; size?: number }[],
) {
	const files: Record<
		string,
		{
			dir: boolean;
			_data?: { uncompressedSize: number };
			async: (type: string) => Promise<Uint8Array>;
		}
	> = {};

	for (const entry of entries) {
		files[entry.path] = {
			dir: false,
			_data: entry.size != null ? { uncompressedSize: entry.size } : undefined,
			async: async () => entry.data,
		};
	}

	return {
		loadAsync: async () => ({
			files,
			file: (path: string) => files[path] ?? null,
		}),
	};
}

/** Dummy PNG bytes (not a real image — the test mocks createImageBitmap). */
const DUMMY_PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Set up mocks for createImageBitmap and document.createElement("canvas")
 * so the decoder's bitmap → canvas → RGBA pipeline works in Vitest.
 */
function setupBrowserMocks(width = 2, height = 2) {
	const pixelCount = width * height * 4;
	const fakeImageData = {
		data: new Uint8ClampedArray(pixelCount),
	};
	// Fill with a recognizable pattern: R=10, G=20, B=30, A=255
	for (let i = 0; i < pixelCount; i += 4) {
		fakeImageData.data[i] = 10;
		fakeImageData.data[i + 1] = 20;
		fakeImageData.data[i + 2] = 30;
		fakeImageData.data[i + 3] = 255;
	}

	const fakeCtx = {
		drawImage: vi.fn(),
		getImageData: vi.fn().mockReturnValue(fakeImageData),
	};

	const origCreateElement = document.createElement.bind(document);
	vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
		if (tag === "canvas") {
			return {
				width: 0,
				height: 0,
				getContext: () => fakeCtx,
			} as unknown as HTMLCanvasElement;
		}
		return origCreateElement(tag);
	});

	vi.stubGlobal(
		"createImageBitmap",
		vi.fn().mockResolvedValue({
			width,
			height,
			close: vi.fn(),
		}),
	);
}

describe("decodeXps", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should extract the largest image from an XPS archive", async () => {
		setupBrowserMocks(2, 2);

		const mockZip = makeMockZip([
			{
				path: "Documents/1/Resources/Images/small.png",
				data: DUMMY_PNG,
				size: 50,
			},
			{
				path: "Documents/1/Resources/Images/large.png",
				data: DUMMY_PNG,
				size: 500,
			},
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeXps } = await import(
			"~/features/image-tools/decoders/decode-xps"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-xpsdocument",
		});
		const result = await decodeXps(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);
	});

	it("should fall back to extracting all images when _data.uncompressedSize is missing", async () => {
		setupBrowserMocks(2, 2);

		const mockZip = makeMockZip([
			{
				path: "Resources/image1.jpg",
				data: DUMMY_PNG,
				// No size — forces the fallback path
			},
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeXps } = await import(
			"~/features/image-tools/decoders/decode-xps"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-xpsdocument",
		});
		const result = await decodeXps(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
	});

	it("should throw when no images are found", async () => {
		const mockZip = makeMockZip([
			{
				path: "Documents/1/Pages/1.fpage",
				data: new TextEncoder().encode("<FixedPage/>"),
			},
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeXps } = await import(
			"~/features/image-tools/decoders/decode-xps"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-xpsdocument",
		});

		await expect(decodeXps(blob)).rejects.toThrow("could not be rendered");
	});

	it("should delegate TIFF images to decodeTiff", async () => {
		const fakeRgba = new Uint8Array(4 * 4 * 4);
		fakeRgba.fill(128);

		vi.doMock("~/features/image-tools/decoders/decode-tiff", () => ({
			decodeTiff: async () => ({
				data: fakeRgba,
				width: 4,
				height: 4,
			}),
		}));

		const mockZip = makeMockZip([
			{
				path: "Documents/1/Resources/Images/photo.tiff",
				data: new Uint8Array(100),
				size: 100,
			},
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeXps } = await import(
			"~/features/image-tools/decoders/decode-xps"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-xpsdocument",
		});
		const result = await decodeXps(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(4);
		expect(result.data.length).toBe(4 * 4 * 4);
	});

	it("should throw on corrupt ZIP data", async () => {
		vi.doMock("jszip", () => ({
			default: {
				loadAsync: async () => {
					throw new Error("Not a valid zip");
				},
			},
		}));

		const { decodeXps } = await import(
			"~/features/image-tools/decoders/decode-xps"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-xpsdocument",
		});

		await expect(decodeXps(blob)).rejects.toThrow("could not be opened");
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeXps } = await import(
			"~/features/image-tools/decoders/decode-xps"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-xpsdocument",
		});
		const controller = new AbortController();
		controller.abort();

		await expect(decodeXps(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
