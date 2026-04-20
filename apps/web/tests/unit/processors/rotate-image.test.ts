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

/**
 * Helper to build the pipeline-worker success response matching the
 * shape emitted by workers/image-pipeline.worker.ts.
 */
function mockRotateResponse(width: number, height: number) {
	return {
		output: new Uint8Array([137, 80, 78, 71]), // PNG magic bytes
		extension: ".png",
		mimeType: "image/png",
		metadata: { newWidth: width, newHeight: height },
	};
}

describe("rotateImage processor", () => {
	it("should post pipeline request to worker with defaults", async () => {
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const input = new File(["fake-jpg"], "photo.jpg", { type: "image/jpeg" });

		const promise = rotateImage(input, { action: "rotate-cw" });
		await tick();
		await tick(); // input.arrayBuffer() + worker spawn

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "rotate-image",
				options: expect.objectContaining({
					action: "rotate-cw",
					format: "png",
					quality: 92,
				}),
			}),
		);

		worker.simulateMessage(mockRotateResponse(200, 300));

		const result = await promise;
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.width).toBe(200);
		expect(result.height).toBe(300);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass custom format and quality", async () => {
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const input = new File(["fake-png"], "photo.png", { type: "image/png" });
		const promise = rotateImage(input, {
			action: "flip-h",
			outputFormat: "image/webp",
			quality: 0.8,
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "rotate-image",
				options: expect.objectContaining({
					action: "flip-h",
					format: "webp",
					quality: 80,
				}),
			}),
		);

		worker.simulateMessage(mockRotateResponse(100, 100));
		await promise;
	});

	it("should support all rotate actions", async () => {
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const actions = [
			"rotate-cw",
			"rotate-ccw",
			"rotate-180",
			"flip-h",
			"flip-v",
		] as const;

		for (const action of actions) {
			const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
			const promise = rotateImage(input, { action });
			await tick();
			await tick();

			const worker = getLastInstance();
			expect(worker.postMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					options: expect.objectContaining({ action }),
				}),
			);

			worker.simulateMessage(mockRotateResponse(100, 100));
			await promise;
		}
	});

	it("should propagate errors from worker", async () => {
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = rotateImage(input, { action: "rotate-cw" });
		await tick();
		await tick();

		getLastInstance().simulateMessage({
			error: "Could not get OffscreenCanvas 2D context",
		});

		await expect(promise).rejects.toThrow(/OffscreenCanvas/);
	});

	it("should terminate worker on abort signal", async () => {
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const controller = new AbortController();
		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });

		const promise = rotateImage(input, {
			action: "flip-v",
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
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = rotateImage(input, {
			action: "rotate-180",
			signal: controller.signal,
		});

		await expect(promise).rejects.toThrow(/Aborted/);
	});

	it("should handle worker onerror", async () => {
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = rotateImage(input, { action: "rotate-cw" });
		await tick();
		await tick();

		const worker = getLastInstance();
		worker.simulateError("Worker crashed");

		await expect(promise).rejects.toThrow(/Worker crashed/);
		expect(worker.terminate).toHaveBeenCalled();
	});
});
