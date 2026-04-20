import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockWorkerClass } from "../helpers/mock-worker";

const { MockWorker, getLastInstance } = createMockWorkerClass();

const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
	vi.stubGlobal("Worker", MockWorker);
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function mockImageResponse(width: number, height: number, mime = "image/png") {
	return {
		output: new Uint8Array([1, 2, 3, 4]),
		extension: mime === "image/png" ? ".png" : ".jpg",
		mimeType: mime,
		metadata: { width, height },
	};
}

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
	it("should post pipeline request with defaults", async () => {
		const { resizeImage } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const input = new File(["fake-jpg"], "photo.jpg", { type: "image/jpeg" });
		const promise = resizeImage(input, { width: 400, height: 300 });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "resize-image",
				options: expect.objectContaining({
					width: 400,
					height: 300,
					format: "png",
					quality: 92,
				}),
			}),
		);

		worker.simulateMessage(mockImageResponse(400, 300));
		const result = await promise;
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.width).toBe(400);
		expect(result.height).toBe(300);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass custom format and quality", async () => {
		const { resizeImage } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const input = new File(["fake-png"], "photo.png", { type: "image/png" });
		const promise = resizeImage(input, {
			width: 200,
			height: 150,
			outputFormat: "image/webp",
			quality: 0.75,
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.objectContaining({
					format: "webp",
					quality: 75,
				}),
			}),
		);

		worker.simulateMessage(mockImageResponse(200, 150, "image/webp"));
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { resizeImage } = await import(
			"~/features/image-tools/processors/resize-image"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = resizeImage(input, { width: 100, height: 100 });
		await tick();
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
