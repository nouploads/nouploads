import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Build a buffer with valid DICM magic at offset 128 */
function buildDicomShell(size = 256): Uint8Array {
	const buf = new Uint8Array(size);
	buf[128] = 0x44; // D
	buf[129] = 0x49; // I
	buf[130] = 0x43; // C
	buf[131] = 0x4d; // M
	return buf;
}

describe("decodeDicom", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should reject on corrupt data (too small)", async () => {
		const blob = new Blob([new Uint8Array(50)], {
			type: "application/dicom",
		});

		const { decodeDicom } = await import(
			"~/features/image-tools/decoders/decode-dicom"
		);

		await expect(decodeDicom(blob)).rejects.toThrow("too small");
	});

	it("should reject when DICM magic is missing", async () => {
		// 200 bytes of zeros — no DICM at offset 128
		const blob = new Blob([new Uint8Array(200)], {
			type: "application/dicom",
		});

		const { decodeDicom } = await import(
			"~/features/image-tools/decoders/decode-dicom"
		);

		await expect(decodeDicom(blob)).rejects.toThrow("Missing DICM magic bytes");
	});

	it("should reject when daikon returns null (invalid DICOM structure)", async () => {
		const buf = buildDicomShell();

		vi.doMock("daikon", () => ({
			Series: {
				parseImage: () => null,
				parserError: "Test error",
			},
		}));

		const blob = new Blob([buf as BlobPart], { type: "application/dicom" });

		const { decodeDicom } = await import(
			"~/features/image-tools/decoders/decode-dicom"
		);

		await expect(decodeDicom(blob)).rejects.toThrow("could not be decoded");
	});

	it("should reject when dimensions are missing", async () => {
		const buf = buildDicomShell();

		vi.doMock("daikon", () => ({
			Series: {
				parseImage: () => ({
					getCols: () => 0,
					getRows: () => 0,
					getInterpretedData: () => ({
						data: new Float32Array(0),
						min: 0,
						max: 0,
					}),
					getWindowCenter: () => null,
					getWindowWidth: () => null,
				}),
				parserError: null,
			},
		}));

		const blob = new Blob([buf as BlobPart], { type: "application/dicom" });

		const { decodeDicom } = await import(
			"~/features/image-tools/decoders/decode-dicom"
		);

		await expect(decodeDicom(blob)).rejects.toThrow(
			"Missing or invalid image dimensions",
		);
	});

	it("should reject when getInterpretedData throws", async () => {
		const buf = buildDicomShell();

		vi.doMock("daikon", () => ({
			Series: {
				parseImage: () => ({
					getCols: () => 4,
					getRows: () => 4,
					getInterpretedData: () => {
						throw new Error("Unsupported transfer syntax");
					},
					getWindowCenter: () => null,
					getWindowWidth: () => null,
				}),
				parserError: null,
			},
		}));

		const blob = new Blob([buf as BlobPart], { type: "application/dicom" });

		const { decodeDicom } = await import(
			"~/features/image-tools/decoders/decode-dicom"
		);

		await expect(decodeDicom(blob)).rejects.toThrow(
			"Failed to extract pixel data",
		);
	});

	it("should decode a mocked 2x2 DICOM to RGBA with window/level from tags", async () => {
		const buf = buildDicomShell();

		// Pixel values: 0, 500, 500, 1000
		const pixelData = new Float32Array([0, 500, 500, 1000]);

		vi.doMock("daikon", () => ({
			Series: {
				parseImage: () => ({
					getCols: () => 2,
					getRows: () => 2,
					getInterpretedData: () => ({
						data: pixelData,
						min: 0,
						max: 1000,
						numCols: 2,
						numRows: 2,
					}),
					getWindowCenter: () => 500,
					getWindowWidth: () => 1000,
				}),
				parserError: null,
			},
		}));

		const blob = new Blob([buf as BlobPart], { type: "application/dicom" });

		const { decodeDicom } = await import(
			"~/features/image-tools/decoders/decode-dicom"
		);
		const result = await decodeDicom(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4); // RGBA

		// Window center=500, width=1000 → lower=0, upper=1000
		// Pixel 0 (val=0): (0-0)/1000*255 = 0
		expect(result.data[0]).toBe(0); // R
		expect(result.data[1]).toBe(0); // G
		expect(result.data[2]).toBe(0); // B
		expect(result.data[3]).toBe(255); // A

		// Pixel 1 (val=500): (500-0)/1000*255 = 128
		expect(result.data[4]).toBe(128); // R
		expect(result.data[7]).toBe(255); // A

		// Pixel 3 (val=1000): (1000-0)/1000*255 = 255
		expect(result.data[12]).toBe(255); // R
		expect(result.data[15]).toBe(255); // A
	});

	it("should fall back to auto window/level when tags are missing", async () => {
		const buf = buildDicomShell();

		const pixelData = new Float32Array([100, 200, 300, 400]);

		vi.doMock("daikon", () => ({
			Series: {
				parseImage: () => ({
					getCols: () => 2,
					getRows: () => 2,
					getInterpretedData: () => ({
						data: pixelData,
						min: 100,
						max: 400,
						numCols: 2,
						numRows: 2,
					}),
					getWindowCenter: () => null,
					getWindowWidth: () => null,
				}),
				parserError: null,
			},
		}));

		const blob = new Blob([buf as BlobPart], { type: "application/dicom" });

		const { decodeDicom } = await import(
			"~/features/image-tools/decoders/decode-dicom"
		);
		const result = await decodeDicom(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data.length).toBe(16);

		// Auto: center=(100+400)/2=250, width=400-100=300
		// lower=250-150=100, upper=250+150=400
		// Pixel 0 (val=100): (100-100)/300*255 = 0
		expect(result.data[0]).toBe(0);
		// Pixel 3 (val=400): (400-100)/300*255 = 255
		expect(result.data[12]).toBe(255);
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeDicom } = await import(
			"~/features/image-tools/decoders/decode-dicom"
		);
		const blob = new Blob([new Uint8Array(200)], {
			type: "application/dicom",
		});
		const controller = new AbortController();
		controller.abort();

		await expect(decodeDicom(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
