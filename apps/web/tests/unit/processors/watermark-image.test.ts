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

function mockWatermarkResponse(width = 800, height = 600, mime = "image/png") {
	return {
		output: new Uint8Array([1, 2, 3, 4]),
		extension: mime === "image/png" ? ".png" : ".jpg",
		mimeType: mime,
		metadata: { width, height },
	};
}

describe("watermarkImage processor", () => {
	it("should post watermark options through pipeline", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const input = new File(["fake-jpg"], "photo.jpg", { type: "image/jpeg" });
		const promise = watermarkImage(input, {
			text: "DRAFT",
			fontSize: 64,
			opacity: 0.5,
			rotation: -45,
			color: "#ff0000",
			mode: "center",
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "watermark-image",
				options: expect.objectContaining({
					text: "DRAFT",
					fontSize: 64,
					opacity: 0.5,
					rotation: -45,
					color: "#ff0000",
					mode: "center",
					format: "png",
					quality: 92,
				}),
			}),
		);

		worker.simulateMessage(mockWatermarkResponse(800, 600));
		const result = await promise;
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
	});

	it("should pass tiled mode through", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const input = new File(["fake"], "photo.png", { type: "image/png" });
		const promise = watermarkImage(input, {
			text: "CONFIDENTIAL",
			fontSize: 36,
			opacity: 0.2,
			rotation: -30,
			color: "#000000",
			mode: "tiled",
			outputFormat: "image/png",
			quality: 0.92,
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.objectContaining({
					mode: "tiled",
					format: "png",
				}),
			}),
		);

		worker.simulateMessage(mockWatermarkResponse());
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = watermarkImage(input, {
			text: "X",
			fontSize: 32,
			opacity: 0.3,
			rotation: 0,
			color: "#000000",
			mode: "center",
		});
		await tick();
		await tick();

		getLastInstance().simulateMessage({ error: "Watermark failed" });
		await expect(promise).rejects.toThrow(/Watermark failed/);
	});

	it("should terminate worker on abort signal", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const controller = new AbortController();
		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = watermarkImage(input, {
			text: "A",
			fontSize: 32,
			opacity: 0.3,
			rotation: 0,
			color: "#000",
			mode: "center",
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
