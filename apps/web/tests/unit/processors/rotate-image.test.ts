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

describe("rotateImage processor", () => {
	it("should post blob and action to worker with defaults", async () => {
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const input = new File(["fake-jpg"], "photo.jpg", {
			type: "image/jpeg",
		});
		const output = new Blob(["rotated"], { type: "image/png" });

		const promise = rotateImage(input, { action: "rotate-cw" });
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			action: "rotate-cw",
			outputFormat: "image/png",
			quality: 0.92,
		});

		worker.simulateMessage({ blob: output, width: 200, height: 300 });

		const result = await promise;
		expect(result.blob).toBe(output);
		expect(result.width).toBe(200);
		expect(result.height).toBe(300);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass custom format and quality to worker", async () => {
		const { rotateImage } = await import(
			"~/features/image-tools/processors/rotate-image"
		);

		const input = new File(["fake-png"], "photo.png", {
			type: "image/png",
		});
		const promise = rotateImage(input, {
			action: "flip-h",
			outputFormat: "image/webp",
			quality: 0.8,
		});
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			action: "flip-h",
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

			const worker = getLastInstance();
			expect(worker.postMessage).toHaveBeenCalledWith(
				expect.objectContaining({ action }),
			);

			worker.simulateMessage({
				blob: new Blob(),
				width: 100,
				height: 100,
			});
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

		const worker = getLastInstance();
		worker.simulateError("Worker crashed");

		await expect(promise).rejects.toThrow(/Worker crashed/);
		expect(worker.terminate).toHaveBeenCalled();
	});
});
