import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	detectTransparency,
	extensionForFormat,
	formatRequiresBackground,
} from "~/features/image-tools/processors/convert-image";
import { createMockWorkerClass } from "../helpers/mock-worker";

const { MockWorker, getLastInstance } = createMockWorkerClass();

/** Wait for microtask queue to flush so async worker creation completes */
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
	vi.stubGlobal("Worker", MockWorker);
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("extensionForFormat", () => {
	it("should return correct extensions", () => {
		expect(extensionForFormat("image/jpeg")).toBe("jpg");
		expect(extensionForFormat("image/png")).toBe("png");
		expect(extensionForFormat("image/webp")).toBe("webp");
		expect(extensionForFormat("image/avif")).toBe("avif");
	});
});

describe("convertImage processor", () => {
	it("should post blob and options to worker for non-AVIF formats", async () => {
		const { convertImage } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const input = new Blob(["fake-png"], { type: "image/png" });
		const output = new Blob(["jpg-out"], { type: "image/jpeg" });

		const promise = convertImage(input, { outputFormat: "image/jpeg" });
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			outputFormat: "image/jpeg",
			quality: 0.92,
			backgroundColor: "#ffffff",
		});

		worker.simulateMessage({ blob: output, width: 800, height: 600 });

		const result = await promise;
		expect(result.blob).toBe(output);
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass custom quality and backgroundColor to worker", async () => {
		const { convertImage } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const input = new Blob(["fake-png"], { type: "image/png" });
		const promise = convertImage(input, {
			outputFormat: "image/jpeg",
			quality: 0.75,
			backgroundColor: "#ff0000",
		});
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			outputFormat: "image/jpeg",
			quality: 0.75,
			backgroundColor: "#ff0000",
		});

		worker.simulateMessage({ blob: new Blob(), width: 100, height: 100 });
		await promise;
	});

	it("should use AVIF worker for AVIF output format", async () => {
		const { convertImage } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const input = new Blob(["fake-png"], { type: "image/png" });

		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width: 100, height: 100, close: vi.fn() })),
		);
		vi.spyOn(document, "createElement").mockReturnValue({
			width: 0,
			height: 0,
			getContext: vi.fn(() => ({
				drawImage: vi.fn(),
				fillRect: vi.fn(),
				fillStyle: "",
				getImageData: vi.fn(() => ({
					data: new Uint8ClampedArray(100 * 100 * 4),
					width: 100,
					height: 100,
				})),
			})),
		} as unknown as HTMLElement);

		const avifBuffer = new ArrayBuffer(10);
		const promise = convertImage(input, { outputFormat: "image/avif" });
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				imageData: expect.any(Object),
				quality: 92,
			}),
		);

		worker.simulateMessage({ buffer: avifBuffer });

		const result = await promise;
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("image/avif");
	});

	it("should propagate errors from worker", async () => {
		const { convertImage } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const input = new Blob(["fake"], { type: "image/jpeg" });
		const promise = convertImage(input, { outputFormat: "image/webp" });
		await tick();

		getLastInstance().simulateMessage({
			error:
				"Conversion failed — your browser may not support encoding this format",
		});

		await expect(promise).rejects.toThrow(/browser may not support/i);
	});

	it("should terminate worker on abort signal", async () => {
		const { convertImage } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const controller = new AbortController();
		const input = new Blob(["fake-png"], { type: "image/png" });

		const promise = convertImage(input, {
			outputFormat: "image/webp",
			signal: controller.signal,
		});
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should handle HEIC input by decoding first then converting", async () => {
		const decodedBlob = new Blob(["decoded-png"], { type: "image/png" });
		vi.doMock("heic2any", () => ({
			default: vi.fn(() => Promise.resolve(decodedBlob)),
		}));

		const { convertImage } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const input = new Blob(["fake-heic"], { type: "image/heic" });

		const promise = convertImage(input, { outputFormat: "image/jpeg" });
		await tick();

		// After HEIC decode, the convert worker is spawned
		const convertWorker = getLastInstance();
		expect(convertWorker).not.toBeNull();
		expect(convertWorker.postMessage).toHaveBeenCalledWith({
			blob: decodedBlob,
			outputFormat: "image/jpeg",
			quality: 0.92,
			backgroundColor: "#ffffff",
		});

		convertWorker.simulateMessage({
			blob: new Blob(),
			width: 200,
			height: 150,
		});

		const result = await promise;
		expect(result.width).toBe(200);
		expect(result.height).toBe(150);

		vi.doUnmock("heic2any");
	});
});

describe("convertImageBatch processor", () => {
	it("should process multiple files and return results", async () => {
		const { convertImageBatch } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const input1 = new Blob(["img-1"], { type: "image/jpeg" });
		const input2 = new Blob(["img-2"], { type: "image/png" });
		const output1 = new Blob(["out-1"], { type: "image/png" });
		const output2 = new Blob(["out-2"], { type: "image/png" });

		const promise = convertImageBatch([input1, input2], {
			outputFormat: "image/png",
		});
		await tick();

		getLastInstance().simulateMessage({
			blob: output1,
			width: 100,
			height: 100,
		});
		await tick();
		getLastInstance().simulateMessage({
			blob: output2,
			width: 100,
			height: 100,
		});

		const results = await promise;
		expect(results).toHaveLength(2);
		expect((results[0] as { blob: Blob }).blob).toBe(output1);
		expect((results[1] as { blob: Blob }).blob).toBe(output2);
	});

	it("should return Error for failed files without stopping batch", async () => {
		const { convertImageBatch } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const input1 = new Blob(["img-1"], { type: "image/jpeg" });
		const input2 = new Blob(["bad"]);

		const promise = convertImageBatch([input1, input2], {
			outputFormat: "image/png",
		});
		await tick();

		getLastInstance().simulateMessage({
			blob: new Blob(),
			width: 100,
			height: 100,
		});
		await tick();
		getLastInstance().simulateMessage({ error: "Corrupt image" });

		const results = await promise;
		expect(results).toHaveLength(2);
		expect(results[0]).toHaveProperty("blob");
		expect(results[1]).toBeInstanceOf(Error);
	});

	it("should call onProgress for each file", async () => {
		const { convertImageBatch } = await import(
			"~/features/image-tools/processors/convert-image"
		);

		const input1 = new Blob(["img-1"], { type: "image/jpeg" });
		const input2 = new Blob(["img-2"], { type: "image/jpeg" });
		const onProgress = vi.fn();

		const promise = convertImageBatch(
			[input1, input2],
			{ outputFormat: "image/png" },
			onProgress,
		);
		await tick();

		getLastInstance().simulateMessage({
			blob: new Blob(),
			width: 100,
			height: 100,
		});
		await tick();
		getLastInstance().simulateMessage({
			blob: new Blob(),
			width: 100,
			height: 100,
		});

		await promise;
		expect(onProgress).toHaveBeenCalledWith(0, 2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
	});
});

describe("formatRequiresBackground", () => {
	it("should return true for JPEG", () => {
		expect(formatRequiresBackground("image/jpeg")).toBe(true);
	});

	it("should return false for PNG, WebP, AVIF", () => {
		expect(formatRequiresBackground("image/png")).toBe(false);
		expect(formatRequiresBackground("image/webp")).toBe(false);
		expect(formatRequiresBackground("image/avif")).toBe(false);
	});
});

describe("detectTransparency", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("should return true when image has transparent pixels", async () => {
		const input = new Blob(["fake"], { type: "image/png" });

		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width: 10, height: 10, close: vi.fn() })),
		);

		const pixelData = new Uint8ClampedArray(4 * 4);
		pixelData.set([
			255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 0, 0, 0, 255,
		]);

		vi.spyOn(document, "createElement").mockReturnValue({
			width: 0,
			height: 0,
			getContext: vi.fn(() => ({
				drawImage: vi.fn(),
				getImageData: vi.fn(() => ({ data: pixelData })),
			})),
		} as unknown as HTMLElement);

		const result = await detectTransparency(input);
		expect(result).toBe(true);
	});

	it("should return false when all pixels are opaque", async () => {
		const input = new Blob(["fake"], { type: "image/jpeg" });

		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width: 10, height: 10, close: vi.fn() })),
		);

		const pixelData = new Uint8ClampedArray(4 * 4);
		pixelData.set([
			255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 0, 0, 0, 255,
		]);

		vi.spyOn(document, "createElement").mockReturnValue({
			width: 0,
			height: 0,
			getContext: vi.fn(() => ({
				drawImage: vi.fn(),
				getImageData: vi.fn(() => ({ data: pixelData })),
			})),
		} as unknown as HTMLElement);

		const result = await detectTransparency(input);
		expect(result).toBe(false);
	});

	it("should return false when canvas context is unavailable", async () => {
		const input = new Blob(["fake"], { type: "image/png" });

		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width: 10, height: 10, close: vi.fn() })),
		);

		vi.spyOn(document, "createElement").mockReturnValue({
			width: 0,
			height: 0,
			getContext: vi.fn(() => null),
		} as unknown as HTMLElement);

		const result = await detectTransparency(input);
		expect(result).toBe(false);
	});
});
