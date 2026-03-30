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

describe("cropImage processor", () => {
	it("should post blob and crop region to worker", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const input = new File(["fake-jpg"], "photo.jpg", {
			type: "image/jpeg",
		});
		const output = new Blob(["cropped"], { type: "image/jpeg" });

		const promise = cropImage(input, {
			crop: { x: 10, y: 20, width: 200, height: 150 },
		});
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			x: 10,
			y: 20,
			width: 200,
			height: 150,
			outputFormat: "image/png",
			quality: 0.92,
		});

		worker.simulateMessage({ blob: output, width: 200, height: 150 });

		const result = await promise;
		expect(result.blob).toBe(output);
		expect(result.width).toBe(200);
		expect(result.height).toBe(150);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass custom format and quality to worker", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const input = new File(["fake-png"], "photo.png", {
			type: "image/png",
		});
		const promise = cropImage(input, {
			crop: { x: 0, y: 0, width: 100, height: 100 },
			outputFormat: "image/webp",
			quality: 0.8,
		});
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			outputFormat: "image/webp",
			quality: 0.8,
		});

		worker.simulateMessage({
			blob: new Blob(),
			width: 100,
			height: 100,
		});
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = cropImage(input, {
			crop: { x: 0, y: 0, width: 50, height: 50 },
		});
		await tick();

		getLastInstance().simulateMessage({
			error: "Could not get OffscreenCanvas 2D context",
		});

		await expect(promise).rejects.toThrow(/OffscreenCanvas/);
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

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal is already aborted", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = cropImage(input, {
			crop: { x: 0, y: 0, width: 100, height: 100 },
			signal: controller.signal,
		});

		await expect(promise).rejects.toThrow(/Aborted/);
	});

	it("should handle zero-offset crop at origin", async () => {
		const { cropImage } = await import(
			"~/features/image-tools/processors/crop-image"
		);

		const input = new File(["fake"], "test.png", { type: "image/png" });
		const output = new Blob(["out"], { type: "image/png" });

		const promise = cropImage(input, {
			crop: { x: 0, y: 0, width: 300, height: 200 },
			outputFormat: "image/png",
		});
		await tick();

		const worker = getLastInstance();
		worker.simulateMessage({ blob: output, width: 300, height: 200 });

		const result = await promise;
		expect(result.width).toBe(300);
		expect(result.height).toBe(200);
	});
});
