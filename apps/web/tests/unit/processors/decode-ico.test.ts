import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIXTURE = join(__dirname, "../../e2e/fixtures/sample.ico");

describe("decodeIco", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a real ICO file to RGBA pixels", async () => {
		const bytes = readFileSync(FIXTURE);
		const blob = new Blob([bytes], { type: "image/x-icon" });

		const { decodeIco } = await import(
			"~/features/image-tools/decoders/decode-ico"
		);
		const result = await decodeIco(blob);

		expect(result.width).toBeGreaterThan(0);
		expect(result.height).toBeGreaterThan(0);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(result.width * result.height * 4);
	});

	it("should reject on corrupt data", async () => {
		const blob = new Blob([new Uint8Array(100)], { type: "image/x-icon" });

		const { decodeIco } = await import(
			"~/features/image-tools/decoders/decode-ico"
		);

		await expect(decodeIco(blob)).rejects.toThrow();
	});

	it("should respect abort signal", async () => {
		const bytes = readFileSync(FIXTURE);
		const blob = new Blob([bytes], { type: "image/x-icon" });
		const controller = new AbortController();
		controller.abort();

		const { decodeIco } = await import(
			"~/features/image-tools/decoders/decode-ico"
		);

		await expect(decodeIco(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
