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

function mockFaviconResponse() {
	return {
		outputs: [
			{
				bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x16]),
				filename: "favicon-16x16.png",
				mimeType: "image/png",
			},
			{
				bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x32]),
				filename: "favicon-32x32.png",
				mimeType: "image/png",
			},
			{
				bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x48]),
				filename: "favicon-48x48.png",
				mimeType: "image/png",
			},
			{
				bytes: new Uint8Array([0x00, 0x00, 0x01, 0x00]),
				filename: "favicon.ico",
				mimeType: "image/x-icon",
			},
		],
		metadata: {
			sizes: ["16x16", "32x32", "48x48"],
		},
	};
}

describe("generateFavicon processor", () => {
	it("should dispatch pipeline request and split multi-output into ico + sized PNGs", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const input = new File(["fake-image"], "logo.png", { type: "image/png" });
		const promise = generateFavicon(input, { sizes: [16, 32, 48] });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "favicon-generator",
				input: expect.any(Uint8Array),
			}),
		);

		worker.simulateMessage(mockFaviconResponse());

		const result = await promise;
		expect(result.icoBlob).toBeInstanceOf(Blob);
		expect(result.icoBlob.type).toBe("image/x-icon");
		expect(result.sizes).toHaveLength(3);
		expect(result.sizes[0].size).toBe(16);
		expect(result.sizes[1].size).toBe(32);
		expect(result.sizes[2].size).toBe(48);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should use default behaviour when sizes omitted", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });
		const promise = generateFavicon(input);
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({ toolId: "favicon-generator" }),
		);

		worker.simulateMessage(mockFaviconResponse());
		const result = await promise;
		expect(result.sizes.map((s) => s.size)).toEqual([16, 32, 48]);
	});

	it("should propagate errors from worker", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = generateFavicon(input);
		await tick();
		await tick();

		getLastInstance().simulateMessage({
			error: "Could not get OffscreenCanvas 2D context",
		});

		await expect(promise).rejects.toThrow(/OffscreenCanvas/);
	});

	it("should terminate worker on abort signal", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const controller = new AbortController();
		const input = new File(["fake"], "test.png", { type: "image/png" });
		const promise = generateFavicon(input, { signal: controller.signal });
		await tick();
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal is already aborted", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new File(["fake"], "test.png", { type: "image/png" });
		await expect(
			generateFavicon(input, { signal: controller.signal }),
		).rejects.toThrow(/Aborted/);
	});

	it("should throw if pipeline returns no ICO output", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const input = new File(["fake"], "test.png", { type: "image/png" });
		const promise = generateFavicon(input);
		await tick();
		await tick();

		getLastInstance().simulateMessage({
			outputs: [
				{
					bytes: new Uint8Array([1]),
					filename: "favicon-16x16.png",
					mimeType: "image/png",
				},
			],
		});

		await expect(promise).rejects.toThrow(/\.ico/);
	});
});
