import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a fake PNG byte sequence: 89 50 4E 47 ... IEND
 * Must be large enough that IEND falls before the scan boundary (data.length - 8).
 */
function makeFakePng(size = 200): Uint8Array {
	// Ensure minimum size so IEND is reachable by the scanner
	const actualSize = Math.max(size, 30);
	const data = new Uint8Array(actualSize);
	// PNG signature
	data[0] = 0x89;
	data[1] = 0x50;
	data[2] = 0x4e;
	data[3] = 0x47;
	data[4] = 0x0d;
	data[5] = 0x0a;
	data[6] = 0x1a;
	data[7] = 0x0a;
	// Fill middle
	for (let i = 8; i < actualSize - 16; i++) {
		data[i] = i & 0xff;
	}
	// IEND chunk marker — place well before the end so scanner finds it
	const iendOffset = actualSize - 16;
	data[iendOffset] = 0x49; // I
	data[iendOffset + 1] = 0x45; // E
	data[iendOffset + 2] = 0x4e; // N
	data[iendOffset + 3] = 0x44; // D
	// 4 bytes CRC (arbitrary)
	data[iendOffset + 4] = 0xae;
	data[iendOffset + 5] = 0x42;
	data[iendOffset + 6] = 0x60;
	data[iendOffset + 7] = 0x82;
	return data;
}

/**
 * Build a mock CFB container with the given entries.
 */
function makeMockCfb(
	entries: { name: string; content: Uint8Array; type?: number }[],
) {
	return {
		read: (_data: unknown, _opts?: unknown) => ({
			FullPaths: entries.map((e) => `/${e.name}`),
			FileIndex: entries.map((e) => ({
				name: e.name,
				content: e.content,
				type: e.type ?? 2,
			})),
		}),
	};
}

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

describe("decodePub", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should extract embedded PNG from PUB OLE2 container", async () => {
		setupBrowserMocks(5, 5);

		const pngData = makeFakePng(200);
		const mockCfb = makeMockCfb([
			{ name: "Contents", content: pngData },
			{ name: "CompObj", content: new Uint8Array(20) },
		]);

		vi.doMock("cfb", () => mockCfb);

		const { decodePub } = await import(
			"~/features/image-tools/decoders/decode-pub"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/x-mspublisher",
		});
		const result = await decodePub(blob);

		expect(result.width).toBe(5);
		expect(result.height).toBe(5);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(5 * 5 * 4);
	});

	it("should throw when no embedded images found", async () => {
		const mockCfb = makeMockCfb([
			{ name: "Contents", content: new Uint8Array(50) },
			{ name: "Quill", content: new Uint8Array(30) },
		]);

		vi.doMock("cfb", () => mockCfb);

		const { decodePub } = await import(
			"~/features/image-tools/decoders/decode-pub"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/x-mspublisher",
		});

		await expect(decodePub(blob)).rejects.toThrow("could not be rendered");
	});

	it("should throw on corrupt OLE2 data", async () => {
		vi.doMock("cfb", () => ({
			read: () => {
				throw new Error("Not a valid CFB");
			},
		}));

		const { decodePub } = await import(
			"~/features/image-tools/decoders/decode-pub"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/x-mspublisher",
		});

		await expect(decodePub(blob)).rejects.toThrow("could not be opened");
	});

	it("should pick the largest embedded image across streams", async () => {
		setupBrowserMocks(6, 6);

		const smallPng = makeFakePng(50);
		const largePng = makeFakePng(500);

		const mockCfb = makeMockCfb([
			{ name: "SmallImage", content: smallPng },
			{ name: "LargeImage", content: largePng },
		]);

		vi.doMock("cfb", () => mockCfb);

		const { decodePub } = await import(
			"~/features/image-tools/decoders/decode-pub"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/x-mspublisher",
		});
		const result = await decodePub(blob);

		expect(result.width).toBe(6);
		expect(result.height).toBe(6);
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodePub } = await import(
			"~/features/image-tools/decoders/decode-pub"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/x-mspublisher",
		});
		const controller = new AbortController();
		controller.abort();

		await expect(decodePub(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
