import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a fake JPEG byte sequence: FF D8 FF ... FF D9
 */
function makeFakeJpeg(size = 100): Uint8Array {
	const data = new Uint8Array(size);
	// JPEG SOI marker
	data[0] = 0xff;
	data[1] = 0xd8;
	data[2] = 0xff;
	// Fill middle with arbitrary data
	for (let i = 3; i < size - 2; i++) {
		data[i] = i & 0xff;
	}
	// JPEG EOI marker
	data[size - 2] = 0xff;
	data[size - 1] = 0xd9;
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
				type: e.type ?? 2, // 2 = stream
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

describe("decodeVsd", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should extract embedded JPEG from VSD OLE2 container", async () => {
		setupBrowserMocks(3, 3);

		const jpegData = makeFakeJpeg(200);
		const mockCfb = makeMockCfb([
			{ name: "VisioDocument", content: new Uint8Array(50) },
			{ name: "SummaryInformation", content: jpegData },
		]);

		vi.doMock("cfb", () => mockCfb);

		const { decodeVsd } = await import(
			"~/features/image-tools/decoders/decode-vsd"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.visio",
		});
		const result = await decodeVsd(blob);

		expect(result.width).toBe(3);
		expect(result.height).toBe(3);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(3 * 3 * 4);
	});

	it("should throw when no embedded images found", async () => {
		const mockCfb = makeMockCfb([
			{ name: "VisioDocument", content: new Uint8Array(50) },
			{ name: "CompObj", content: new Uint8Array(20) },
		]);

		vi.doMock("cfb", () => mockCfb);

		const { decodeVsd } = await import(
			"~/features/image-tools/decoders/decode-vsd"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.visio",
		});

		await expect(decodeVsd(blob)).rejects.toThrow("could not be rendered");
	});

	it("should throw on corrupt OLE2 data", async () => {
		vi.doMock("cfb", () => ({
			read: () => {
				throw new Error("Not a valid CFB");
			},
		}));

		const { decodeVsd } = await import(
			"~/features/image-tools/decoders/decode-vsd"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.visio",
		});

		await expect(decodeVsd(blob)).rejects.toThrow("could not be opened");
	});

	it("should pick the largest embedded image", async () => {
		setupBrowserMocks(4, 4);

		const smallJpeg = makeFakeJpeg(50);
		const largeJpeg = makeFakeJpeg(500);

		// Create a stream that has both a small and large JPEG embedded
		const combinedContent = new Uint8Array(
			smallJpeg.length + 10 + largeJpeg.length,
		);
		combinedContent.set(smallJpeg, 0);
		combinedContent.set(largeJpeg, smallJpeg.length + 10);

		const mockCfb = makeMockCfb([
			{ name: "Contents", content: combinedContent },
		]);

		vi.doMock("cfb", () => mockCfb);

		const { decodeVsd } = await import(
			"~/features/image-tools/decoders/decode-vsd"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.visio",
		});
		const result = await decodeVsd(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(4);
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeVsd } = await import(
			"~/features/image-tools/decoders/decode-vsd"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.visio",
		});
		const controller = new AbortController();
		controller.abort();

		await expect(decodeVsd(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
