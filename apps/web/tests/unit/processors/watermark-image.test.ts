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

describe("watermarkImage processor", () => {
	it("should post blob and watermark options to worker", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const input = new File(["fake-jpg"], "photo.jpg", {
			type: "image/jpeg",
		});
		const output = new Blob(["watermarked"], { type: "image/jpeg" });

		const promise = watermarkImage(input, {
			text: "DRAFT",
			fontSize: 64,
			opacity: 0.5,
			rotation: -45,
			color: "#ff0000",
			mode: "center",
		});
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			text: "DRAFT",
			fontSize: 64,
			opacity: 0.5,
			rotation: -45,
			color: "#ff0000",
			mode: "center",
			outputFormat: "image/png",
			quality: 0.92,
		});

		worker.simulateMessage({ blob: output, width: 800, height: 600 });

		const result = await promise;
		expect(result.blob).toBe(output);
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass tiled mode to worker", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const input = new File(["fake-png"], "photo.png", {
			type: "image/png",
		});

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

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({ mode: "tiled", text: "CONFIDENTIAL" }),
		);

		worker.simulateMessage({
			blob: new Blob(),
			width: 1024,
			height: 768,
		});
		await promise;
	});

	it("should pass custom output format and quality", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const input = new File(["fake-webp"], "photo.webp", {
			type: "image/webp",
		});

		const promise = watermarkImage(input, {
			text: "TEST",
			fontSize: 48,
			opacity: 0.3,
			rotation: 0,
			color: "#333333",
			mode: "center",
			outputFormat: "image/webp",
			quality: 0.8,
		});
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				outputFormat: "image/webp",
				quality: 0.8,
			}),
		);

		worker.simulateMessage({ blob: new Blob(), width: 500, height: 500 });
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = watermarkImage(input, {
			text: "TEST",
			fontSize: 48,
			opacity: 0.3,
			rotation: 0,
			color: "#000000",
			mode: "center",
		});
		await tick();

		getLastInstance().simulateMessage({
			error: "Could not get OffscreenCanvas 2D context",
		});

		await expect(promise).rejects.toThrow(/OffscreenCanvas/);
	});

	it("should terminate worker on abort signal", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const controller = new AbortController();
		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });

		const promise = watermarkImage(input, {
			text: "ABORT",
			fontSize: 48,
			opacity: 0.3,
			rotation: 0,
			color: "#000000",
			mode: "center",
			signal: controller.signal,
		});
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal is already aborted", async () => {
		const { watermarkImage } = await import(
			"~/features/image-tools/processors/watermark-image"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = watermarkImage(input, {
			text: "TEST",
			fontSize: 48,
			opacity: 0.3,
			rotation: 0,
			color: "#000000",
			mode: "center",
			signal: controller.signal,
		});

		await expect(promise).rejects.toThrow(/Aborted/);
	});
});
