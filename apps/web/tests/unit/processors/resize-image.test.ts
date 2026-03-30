import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("getImageDimensions", () => {
	it("should return width and height from createImageBitmap", async () => {
		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width: 800, height: 600, close: vi.fn() })),
		);

		const { getImageDimensions } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const file = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const dims = await getImageDimensions(file);
		expect(dims.width).toBe(800);
		expect(dims.height).toBe(600);
	});

	it("should close the bitmap after reading dimensions", async () => {
		const closeFn = vi.fn();
		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width: 100, height: 100, close: closeFn })),
		);

		const { getImageDimensions } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const file = new File(["fake"], "test.png", { type: "image/png" });
		await getImageDimensions(file);
		expect(closeFn).toHaveBeenCalled();
	});
});

describe("resizeImage processor", () => {
	it("should post blob and options to worker", async () => {
		const { resizeImage } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const input = new File(["fake-jpg"], "photo.jpg", {
			type: "image/jpeg",
		});
		const output = new Blob(["resized"], { type: "image/jpeg" });

		const promise = resizeImage(input, { width: 400, height: 300 });
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			width: 400,
			height: 300,
			outputFormat: "image/png",
			quality: 0.92,
		});

		worker.simulateMessage({ blob: output, width: 400, height: 300 });

		const result = await promise;
		expect(result.blob).toBe(output);
		expect(result.width).toBe(400);
		expect(result.height).toBe(300);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass custom format and quality to worker", async () => {
		const { resizeImage } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const input = new File(["fake-png"], "photo.png", {
			type: "image/png",
		});
		const promise = resizeImage(input, {
			width: 200,
			height: 150,
			outputFormat: "image/webp",
			quality: 0.75,
		});
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			width: 200,
			height: 150,
			outputFormat: "image/webp",
			quality: 0.75,
		});

		worker.simulateMessage({
			blob: new Blob(),
			width: 200,
			height: 150,
		});
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { resizeImage } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = resizeImage(input, { width: 100, height: 100 });
		await tick();

		getLastInstance().simulateMessage({
			error: "Could not get OffscreenCanvas 2D context",
		});

		await expect(promise).rejects.toThrow(/OffscreenCanvas/);
	});

	it("should terminate worker on abort signal", async () => {
		const { resizeImage } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const controller = new AbortController();
		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });

		const promise = resizeImage(input, {
			width: 100,
			height: 100,
			signal: controller.signal,
		});
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal is already aborted", async () => {
		const { resizeImage } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = resizeImage(input, {
			width: 100,
			height: 100,
			signal: controller.signal,
		});

		await expect(promise).rejects.toThrow(/Aborted/);
	});
});
