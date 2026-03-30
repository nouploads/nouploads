import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Helper: build a mock JSZip instance with the given file entries.
 */
function makeMockZip(entries: { path: string; data: Uint8Array }[]) {
	const files: Record<
		string,
		{
			dir: boolean;
			async: (type: string) => Promise<Uint8Array>;
		}
	> = {};

	for (const entry of entries) {
		files[entry.path] = {
			dir: false,
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

/** Dummy JPEG bytes (not a real image — the test mocks createImageBitmap). */
const DUMMY_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

/** Dummy PNG bytes. */
const DUMMY_PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Set up mocks for createImageBitmap and document.createElement("canvas").
 */
function setupBrowserMocks(width = 2, height = 2) {
	const pixelCount = width * height * 4;
	const fakeImageData = {
		data: new Uint8ClampedArray(pixelCount),
	};
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

describe("decodeVsdx", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should extract docProps/thumbnail.jpeg", async () => {
		setupBrowserMocks(4, 3);

		const mockZip = makeMockZip([
			{ path: "docProps/thumbnail.jpeg", data: DUMMY_JPEG },
			{
				path: "visio/pages/page1.xml",
				data: new TextEncoder().encode("<xml/>"),
			},
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeVsdx } = await import(
			"~/features/image-tools/decoders/decode-vsdx"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-visio.drawing.main+xml",
		});
		const result = await decodeVsdx(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(3);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(4 * 3 * 4);
	});

	it("should fall back to visio/media/ images when no thumbnail", async () => {
		setupBrowserMocks(5, 5);

		const mockZip = makeMockZip([
			{
				path: "visio/pages/page1.xml",
				data: new TextEncoder().encode("<xml/>"),
			},
			{ path: "visio/media/image1.png", data: DUMMY_PNG },
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeVsdx } = await import(
			"~/features/image-tools/decoders/decode-vsdx"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-visio.drawing.main+xml",
		});
		const result = await decodeVsdx(blob);

		expect(result.width).toBe(5);
		expect(result.height).toBe(5);
	});

	it("should throw when no images are found", async () => {
		const mockZip = makeMockZip([
			{
				path: "visio/pages/page1.xml",
				data: new TextEncoder().encode("<xml/>"),
			},
			{
				path: "[Content_Types].xml",
				data: new TextEncoder().encode("<xml/>"),
			},
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeVsdx } = await import(
			"~/features/image-tools/decoders/decode-vsdx"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-visio.drawing.main+xml",
		});

		await expect(decodeVsdx(blob)).rejects.toThrow("could not be rendered");
	});

	it("should throw on corrupt ZIP data", async () => {
		vi.doMock("jszip", () => ({
			default: {
				loadAsync: async () => {
					throw new Error("Not a valid zip");
				},
			},
		}));

		const { decodeVsdx } = await import(
			"~/features/image-tools/decoders/decode-vsdx"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-visio.drawing.main+xml",
		});

		await expect(decodeVsdx(blob)).rejects.toThrow("could not be opened");
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeVsdx } = await import(
			"~/features/image-tools/decoders/decode-vsdx"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.ms-visio.drawing.main+xml",
		});
		const controller = new AbortController();
		controller.abort();

		await expect(decodeVsdx(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
