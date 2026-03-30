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

describe("applyImageFilters processor", () => {
	it("should post blob and default filter values to worker", async () => {
		const { applyImageFilters } = await import(
			"~/features/image-tools/processors/image-filters"
		);

		const input = new File(["fake-jpg"], "photo.jpg", {
			type: "image/jpeg",
		});
		const output = new Blob(["filtered"], { type: "image/png" });

		const promise = applyImageFilters(input, {});
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			brightness: 100,
			contrast: 100,
			saturation: 100,
			blur: 0,
			hueRotate: 0,
			grayscale: 0,
			sepia: 0,
			invert: 0,
			outputFormat: "image/png",
			quality: 0.92,
		});

		worker.simulateMessage({
			blob: output,
			width: 800,
			height: 600,
		});

		const result = await promise;
		expect(result.blob).toBe(output);
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass custom filter values to worker", async () => {
		const { applyImageFilters } = await import(
			"~/features/image-tools/processors/image-filters"
		);

		const input = new File(["fake-png"], "photo.png", {
			type: "image/png",
		});
		const promise = applyImageFilters(input, {
			brightness: 150,
			contrast: 80,
			saturation: 50,
			blur: 5,
			hueRotate: 180,
			grayscale: 100,
			sepia: 30,
			invert: 0,
			outputFormat: "image/webp",
			quality: 0.8,
		});
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			brightness: 150,
			contrast: 80,
			saturation: 50,
			blur: 5,
			hueRotate: 180,
			grayscale: 100,
			sepia: 30,
			invert: 0,
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
		const { applyImageFilters } = await import(
			"~/features/image-tools/processors/image-filters"
		);

		const input = new File(["fake"], "bad.jpg", {
			type: "image/jpeg",
		});
		const promise = applyImageFilters(input, {});
		await tick();

		getLastInstance().simulateMessage({
			error: "Could not get OffscreenCanvas 2D context",
		});

		await expect(promise).rejects.toThrow(/OffscreenCanvas/);
	});

	it("should terminate worker on abort signal", async () => {
		const { applyImageFilters } = await import(
			"~/features/image-tools/processors/image-filters"
		);

		const controller = new AbortController();
		const input = new File(["fake"], "test.jpg", {
			type: "image/jpeg",
		});

		const promise = applyImageFilters(input, {
			signal: controller.signal,
		});
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal is already aborted", async () => {
		const { applyImageFilters } = await import(
			"~/features/image-tools/processors/image-filters"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new File(["fake"], "test.jpg", {
			type: "image/jpeg",
		});
		const promise = applyImageFilters(input, {
			signal: controller.signal,
		});

		await expect(promise).rejects.toThrow(/Aborted/);
	});

	it("should handle worker onerror", async () => {
		const { applyImageFilters } = await import(
			"~/features/image-tools/processors/image-filters"
		);

		const input = new File(["fake"], "test.jpg", {
			type: "image/jpeg",
		});
		const promise = applyImageFilters(input, {});
		await tick();

		const worker = getLastInstance();
		worker.simulateError("Worker crashed");

		await expect(promise).rejects.toThrow(/Worker crashed/);
		expect(worker.terminate).toHaveBeenCalled();
	});
});
