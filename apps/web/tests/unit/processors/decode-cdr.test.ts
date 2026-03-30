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

/** Minimal BMP header (14-byte file header + 40-byte DIB header = 54 bytes minimum). */
function makeFakeBmp(width = 2, height = 2): Uint8Array {
	const rowSize = Math.ceil((width * 24) / 32) * 4;
	const pixelDataSize = rowSize * height;
	const fileSize = 54 + pixelDataSize;
	const bmp = new Uint8Array(fileSize);
	const view = new DataView(bmp.buffer);

	// BM magic
	bmp[0] = 0x42;
	bmp[1] = 0x4d;
	view.setUint32(2, fileSize, true); // file size
	view.setUint32(10, 54, true); // pixel data offset
	view.setUint32(14, 40, true); // DIB header size
	view.setInt32(18, width, true); // width
	view.setInt32(22, height, true); // height
	view.setUint16(26, 1, true); // planes
	view.setUint16(28, 24, true); // bits per pixel
	view.setUint32(34, pixelDataSize, true); // image size

	return bmp;
}

/**
 * Build a minimal RIFF CDR with a DISP chunk containing BMP data.
 */
function makeRiffCdrWithDisp(bmpData: Uint8Array): Uint8Array {
	// RIFF header: "RIFF" + size + "CDR "
	// DISP chunk: "DISP" + size + 4-byte format type + BMP data
	const dispChunkDataSize = 4 + bmpData.length; // 4 for clipboard format
	const riffDataSize = 4 + 8 + dispChunkDataSize; // "CDR " + DISP header + data
	const totalSize = 8 + riffDataSize; // "RIFF" + size + data

	const buf = new Uint8Array(totalSize);
	const view = new DataView(buf.buffer);

	// RIFF header
	buf[0] = 0x52; // R
	buf[1] = 0x49; // I
	buf[2] = 0x46; // F
	buf[3] = 0x46; // F
	view.setUint32(4, riffDataSize, true);
	buf[8] = 0x43; // C
	buf[9] = 0x44; // D
	buf[10] = 0x52; // R
	buf[11] = 0x20; // (space)

	// DISP chunk
	buf[12] = 0x44; // D
	buf[13] = 0x49; // I
	buf[14] = 0x53; // S
	buf[15] = 0x50; // P
	view.setUint32(16, dispChunkDataSize, true);
	view.setUint32(20, 0x08, true); // clipboard format type (CF_DIB = 8)

	// BMP data after the 4-byte format type
	buf.set(bmpData, 24);

	return buf;
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

describe("decodeCdr", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should extract BMP from RIFF DISP chunk", async () => {
		setupBrowserMocks(2, 2);

		const bmp = makeFakeBmp(2, 2);
		const riff = makeRiffCdrWithDisp(bmp);

		const { decodeCdr } = await import(
			"~/features/image-tools/decoders/decode-cdr"
		);

		const blob = new Blob([riff as BlobPart], {
			type: "application/vnd.corel-draw",
		});
		const result = await decodeCdr(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);
	});

	it("should extract thumbnail from ZIP-based CDR", async () => {
		setupBrowserMocks(3, 3);

		const dummyPng = new Uint8Array([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		]);

		const mockZip = makeMockZip([
			{ path: "metadata/thumbnail.png", data: dummyPng },
			{
				path: "content/riffData.cdr",
				data: new Uint8Array(100),
			},
		]);

		vi.doMock("jszip", () => ({ default: mockZip }));

		const { decodeCdr } = await import(
			"~/features/image-tools/decoders/decode-cdr"
		);

		// ZIP magic (PK header)
		const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
		const blob = new Blob([zipHeader], {
			type: "application/vnd.corel-draw",
		});
		const result = await decodeCdr(blob);

		expect(result.width).toBe(3);
		expect(result.height).toBe(3);
	});

	it("should throw when no preview is found", async () => {
		// Empty RIFF with no DISP chunk and not a ZIP
		const emptyRiff = new Uint8Array(20);
		emptyRiff[0] = 0x52; // R
		emptyRiff[1] = 0x49; // I
		emptyRiff[2] = 0x46; // F
		emptyRiff[3] = 0x46; // F
		const view = new DataView(emptyRiff.buffer);
		view.setUint32(4, 12, true);
		emptyRiff[8] = 0x43; // C
		emptyRiff[9] = 0x44; // D
		emptyRiff[10] = 0x52; // R
		emptyRiff[11] = 0x20; // (space)

		const { decodeCdr } = await import(
			"~/features/image-tools/decoders/decode-cdr"
		);

		const blob = new Blob([emptyRiff], {
			type: "application/vnd.corel-draw",
		});

		await expect(decodeCdr(blob)).rejects.toThrow("no embedded preview");
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeCdr } = await import(
			"~/features/image-tools/decoders/decode-cdr"
		);

		const blob = new Blob([new Uint8Array(10)], {
			type: "application/vnd.corel-draw",
		});
		const controller = new AbortController();
		controller.abort();

		await expect(decodeCdr(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
