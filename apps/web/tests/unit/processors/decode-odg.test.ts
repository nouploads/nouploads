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

/** Dummy PNG bytes (not a real image — the test mocks createImageBitmap). */
const DUMMY_PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Set up mocks for createImageBitmap and document.createElement("canvas")
 * so the decoder's bitmap -> canvas -> RGBA pipeline works in Vitest.
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

describe("decodeOdg", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should extract the standard ODF thumbnail", async () => {
		setupBrowserMocks(3, 3);

		const mockZip = makeMockZip([
			{ path: "Thumbnails/thumbnail.png", data: DUMMY_PNG },
			{ path: "content.xml", data: new TextEncoder().encode("<xml/>") },
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeOdg } = await import(
			"~/features/image-tools/decoders/decode-odg"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.oasis.opendocument.graphics",
		});
		const result = await decodeOdg(blob);

		expect(result.width).toBe(3);
		expect(result.height).toBe(3);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(3 * 3 * 4);
	});

	it("should fall back to Pictures/ directory when no thumbnail exists", async () => {
		setupBrowserMocks(4, 4);

		const mockZip = makeMockZip([
			{ path: "content.xml", data: new TextEncoder().encode("<xml/>") },
			{ path: "Pictures/diagram.png", data: DUMMY_PNG },
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeOdg } = await import(
			"~/features/image-tools/decoders/decode-odg"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.oasis.opendocument.graphics",
		});
		const result = await decodeOdg(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(4);
	});

	it("should throw when no thumbnail and no images in Pictures/", async () => {
		const mockZip = makeMockZip([
			{ path: "content.xml", data: new TextEncoder().encode("<xml/>") },
			{ path: "styles.xml", data: new TextEncoder().encode("<xml/>") },
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeOdg } = await import(
			"~/features/image-tools/decoders/decode-odg"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.oasis.opendocument.graphics",
		});

		await expect(decodeOdg(blob)).rejects.toThrow("could not be rendered");
	});

	it("should skip SVG files in Pictures/ directory", async () => {
		const mockZip = makeMockZip([
			{
				path: "Pictures/drawing.svg",
				data: new TextEncoder().encode("<svg/>"),
			},
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeOdg } = await import(
			"~/features/image-tools/decoders/decode-odg"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.oasis.opendocument.graphics",
		});

		await expect(decodeOdg(blob)).rejects.toThrow("could not be rendered");
	});

	it("should throw on corrupt ZIP data", async () => {
		vi.doMock("jszip", () => ({
			default: {
				loadAsync: async () => {
					throw new Error("Not a valid zip");
				},
			},
		}));

		const { decodeOdg } = await import(
			"~/features/image-tools/decoders/decode-odg"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.oasis.opendocument.graphics",
		});

		await expect(decodeOdg(blob)).rejects.toThrow("could not be opened");
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeOdg } = await import(
			"~/features/image-tools/decoders/decode-odg"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.oasis.opendocument.graphics",
		});
		const controller = new AbortController();
		controller.abort();

		await expect(decodeOdg(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
