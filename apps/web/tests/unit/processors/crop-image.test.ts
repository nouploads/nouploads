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

function mockCropResponse() {
	return {
		output: new Uint8Array([1, 2, 3, 4]),
		extension: ".png",
		mimeType: "image/png",
		metadata: {},
	};
}

describe("cropImage processor", () => {
	it("should post crop region via pipeline worker", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const input = new File(["fake-jpg"], "photo.jpg", { type: "image/jpeg" });
		const promise = cropImage(input, {
			crop: { x: 10, y: 20, width: 200, height: 150 },
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "crop-image",
				options: expect.objectContaining({
					x: 10,
					y: 20,
					width: 200,
					height: 150,
					format: "png",
					quality: 92,
				}),
			}),
		);

		worker.simulateMessage(mockCropResponse());
		const result = await promise;
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.width).toBe(200);
		expect(result.height).toBe(150);
	});

	it("should pass custom format and quality", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = cropImage(input, {
			crop: { x: 0, y: 0, width: 100, height: 100 },
			outputFormat: "image/webp",
			quality: 0.6,
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.objectContaining({
					format: "webp",
					quality: 60,
				}),
			}),
		);

		worker.simulateMessage(mockCropResponse());
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = cropImage(input, {
			crop: { x: 0, y: 0, width: 100, height: 100 },
		});
		await tick();
		await tick();

		getLastInstance().simulateMessage({ error: "Invalid crop region" });
		await expect(promise).rejects.toThrow(/Invalid crop/);
	});

	it("should terminate worker on abort signal", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const controller = new AbortController();
		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = cropImage(input, {
			crop: { x: 0, y: 0, width: 100, height: 100 },
			signal: controller.signal,
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});
});
