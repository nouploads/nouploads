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

describe("parseGifFrames", () => {
	it("should post ArrayBuffer to worker and return frame data", async () => {
		const { parseGifFrames } = await import(
			"~/features/image-tools/processors/parse-gif-frames"
		);

		const gifBlob = new Blob(["fake-gif"], { type: "image/gif" });
		const promise = parseGifFrames(gifBlob);
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalled();

		// Simulate worker response with 2 frames
		const thumb1 = new Blob(["t1"], { type: "image/png" });
		const thumb2 = new Blob(["t2"], { type: "image/png" });
		const full1 = new Blob(["f1"], { type: "image/png" });
		const full2 = new Blob(["f2"], { type: "image/png" });

		worker.simulateMessage({
			frames: [
				{ index: 0, delay: 100, thumbnailBlob: thumb1, fullBlob: full1 },
				{ index: 1, delay: 50, thumbnailBlob: thumb2, fullBlob: full2 },
			],
			width: 100,
			height: 80,
		});

		const result = await promise;
		expect(result.width).toBe(100);
		expect(result.height).toBe(80);
		expect(result.frames).toHaveLength(2);
		expect(result.frames[0].index).toBe(0);
		expect(result.frames[0].delay).toBe(100);
		expect(result.frames[0].blob).toBe(full1);
		expect(result.frames[0].thumbnailUrl).toMatch(/^blob:/);
		expect(result.frames[0].previewUrl).toMatch(/^blob:/);
		expect(result.frames[1].index).toBe(1);
		expect(result.frames[1].delay).toBe(50);
	});

	it("should reject on worker error message", async () => {
		const { parseGifFrames } = await import(
			"~/features/image-tools/processors/parse-gif-frames"
		);

		const gifBlob = new Blob(["bad-gif"], { type: "image/gif" });
		const promise = parseGifFrames(gifBlob);
		await tick();

		const worker = getLastInstance();
		worker.simulateMessage({ error: "Invalid GIF format" });

		await expect(promise).rejects.toThrow("Invalid GIF format");
	});

	it("should terminate worker on abort", async () => {
		const { parseGifFrames } = await import(
			"~/features/image-tools/processors/parse-gif-frames"
		);

		const controller = new AbortController();
		const gifBlob = new Blob(["fake-gif"], { type: "image/gif" });
		const promise = parseGifFrames(gifBlob, controller.signal);
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal already aborted", async () => {
		const { parseGifFrames } = await import(
			"~/features/image-tools/processors/parse-gif-frames"
		);

		const controller = new AbortController();
		controller.abort();

		const gifBlob = new Blob(["fake-gif"], { type: "image/gif" });
		await expect(parseGifFrames(gifBlob, controller.signal)).rejects.toThrow();
	});
});

describe("revokeGifFrameUrls", () => {
	it("should revoke all thumbnail URLs", async () => {
		const { revokeGifFrameUrls } = await import(
			"~/features/image-tools/processors/parse-gif-frames"
		);

		const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

		const frames = [
			{
				index: 0,
				delay: 100,
				thumbnailUrl: "blob:http://test/t1",
				previewUrl: "blob:http://test/p1",
				blob: new Blob(),
			},
			{
				index: 1,
				delay: 50,
				thumbnailUrl: "blob:http://test/t2",
				previewUrl: "blob:http://test/p2",
				blob: new Blob(),
			},
		];

		revokeGifFrameUrls(frames);
		expect(revokeSpy).toHaveBeenCalledTimes(4);
		expect(revokeSpy).toHaveBeenCalledWith("blob:http://test/t1");
		expect(revokeSpy).toHaveBeenCalledWith("blob:http://test/p1");
		expect(revokeSpy).toHaveBeenCalledWith("blob:http://test/t2");
		expect(revokeSpy).toHaveBeenCalledWith("blob:http://test/p2");
	});
});
