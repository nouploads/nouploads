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

function mockResponse() {
	return {
		output: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
		extension: ".png",
		mimeType: "image/png",
		metadata: { width: 800, height: 600 },
	};
}

describe("compressPng processor", () => {
	it("should post pipeline request to compress-png tool", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input = new Blob(["fake-png"], { type: "image/png" });
		const promise = compressPng(input, { colors: 128 });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "compress-png",
				options: { colors: 128 },
			}),
		);

		worker.simulateMessage(mockResponse());
		const result = await promise;
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should use default 256 colors when no options provided", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input = new Blob(["fake-png"], { type: "image/png" });
		const promise = compressPng(input);
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "compress-png",
				options: { colors: 256 },
			}),
		);

		worker.simulateMessage(mockResponse());
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input = new Blob(["bad"], { type: "image/png" });
		const promise = compressPng(input);
		await tick();
		await tick();

		getLastInstance().simulateMessage({ error: "Corrupt image" });

		await expect(promise).rejects.toThrow(/Corrupt/);
	});

	it("should terminate worker on abort signal", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const controller = new AbortController();
		const input = new Blob(["fake-png"], { type: "image/png" });
		const promise = compressPng(input, {
			colors: 128,
			signal: controller.signal,
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal already aborted", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const controller = new AbortController();
		controller.abort();

		await expect(
			compressPng(new Blob([], { type: "image/png" }), {
				colors: 128,
				signal: controller.signal,
			}),
		).rejects.toThrow();
	});
});

describe("compressPngBatch processor", () => {
	it("should process multiple files and return results", async () => {
		const { compressPngBatch } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const inputs = [
			new Blob(["img-1"], { type: "image/png" }),
			new Blob(["img-2"], { type: "image/png" }),
		];

		const promise = compressPngBatch(inputs, { colors: 128 });

		for (let i = 0; i < 2; i++) {
			await tick();
			await tick();
			getLastInstance().simulateMessage(mockResponse());
		}

		const results = await promise;
		expect(results).toHaveLength(2);
		expect((results[0] as { blob: Blob }).blob).toBeInstanceOf(Blob);
		expect((results[1] as { blob: Blob }).blob).toBeInstanceOf(Blob);
	});

	it("should return Error for failed files without stopping batch", async () => {
		const { compressPngBatch } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const inputs = [
			new Blob(["img-1"], { type: "image/png" }),
			new Blob(["bad"], { type: "image/png" }),
			new Blob(["img-3"], { type: "image/png" }),
		];

		const promise = compressPngBatch(inputs, { colors: 256 });

		await tick();
		await tick();
		getLastInstance().simulateMessage(mockResponse());
		await tick();
		await tick();
		getLastInstance().simulateMessage({ error: "Corrupt image" });
		await tick();
		await tick();
		getLastInstance().simulateMessage(mockResponse());

		const results = await promise;
		expect(results).toHaveLength(3);
		expect(results[0]).toHaveProperty("blob");
		expect(results[1]).toBeInstanceOf(Error);
		expect((results[1] as Error).message).toBe("Corrupt image");
		expect(results[2]).toHaveProperty("blob");
	});
});
