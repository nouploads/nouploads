import { expect, test } from "@playwright/test";

/**
 * Browser API canary tests — Phase 0 gate for cross-browser testing.
 *
 * These verify that the browser APIs our tools depend on actually work
 * in each Playwright browser engine. If any canary fails on a browser,
 * all tools using that API must be skipped on that browser.
 */
test.describe("Browser API canary", () => {
	test("OffscreenCanvas.convertToBlob() works in Worker", async ({
		page,
		browserName,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });

		const result = await page.evaluate(async () => {
			return new Promise<{ ok: boolean; size?: number; error?: string }>(
				(resolve) => {
					const code = `
					self.onmessage = async () => {
						try {
							const c = new OffscreenCanvas(10, 10);
							const ctx = c.getContext('2d');
							ctx.fillStyle = 'red';
							ctx.fillRect(0, 0, 10, 10);
							const blob = await c.convertToBlob({ type: 'image/png' });
							self.postMessage({ ok: true, size: blob.size });
						} catch (e) {
							self.postMessage({ ok: false, error: e.message });
						}
					};
				`;
					const w = new Worker(
						URL.createObjectURL(new Blob([code], { type: "text/javascript" })),
					);
					w.onmessage = (e) => {
						w.terminate();
						resolve(e.data);
					};
					w.onerror = (e) => {
						w.terminate();
						resolve({ ok: false, error: e.message });
					};
					w.postMessage("go");
				},
			);
		});

		console.log(
			`[${browserName}] OffscreenCanvas.convertToBlob in Worker:`,
			JSON.stringify(result),
		);
		expect(result.ok).toBe(true);
		expect(result.size).toBeGreaterThan(0);
	});

	test("createImageBitmap works in Worker", async ({ page, browserName }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });

		const result = await page.evaluate(async () => {
			return new Promise<{
				ok: boolean;
				w?: number;
				h?: number;
				error?: string;
			}>((resolve) => {
				const code = `
					self.onmessage = async (e) => {
						try {
							const bmp = await createImageBitmap(e.data);
							self.postMessage({ ok: true, w: bmp.width, h: bmp.height });
							bmp.close();
						} catch (e) {
							self.postMessage({ ok: false, error: e.message });
						}
					};
				`;
				const canvas = document.createElement("canvas");
				canvas.width = 10;
				canvas.height = 10;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					resolve({ ok: false, error: "No 2d context" });
					return;
				}
				ctx.fillStyle = "blue";
				ctx.fillRect(0, 0, 10, 10);
				canvas.toBlob((blob) => {
					if (!blob) {
						resolve({ ok: false, error: "toBlob returned null" });
						return;
					}
					const w = new Worker(
						URL.createObjectURL(new Blob([code], { type: "text/javascript" })),
					);
					w.onmessage = (e) => {
						w.terminate();
						resolve(e.data);
					};
					w.onerror = (e) => {
						w.terminate();
						resolve({ ok: false, error: e.message });
					};
					w.postMessage(blob);
				});
			});
		});

		console.log(
			`[${browserName}] createImageBitmap in Worker:`,
			JSON.stringify(result),
		);
		expect(result.ok).toBe(true);
		expect(result.w).toBe(10);
		expect(result.h).toBe(10);
	});

	test("SubtleCrypto.digest works", async ({ page, browserName }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });

		const hash = await page.evaluate(async () => {
			const data = new TextEncoder().encode("test");
			const buf = await crypto.subtle.digest("SHA-256", data);
			return Array.from(new Uint8Array(buf))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
		});

		console.log(`[${browserName}] SubtleCrypto SHA-256:`, hash);
		expect(hash).toBe(
			"9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
		);
	});

	test("TextEncoder handles non-ASCII correctly", async ({
		page,
		browserName,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });

		const result = await page.evaluate(() => {
			const encoder = new TextEncoder();
			const decoder = new TextDecoder();
			const input = "Hello \u00e9\u00e8\u00ea \u4e16\u754c \ud83c\udf0d";
			const encoded = encoder.encode(input);
			const decoded = decoder.decode(encoded);
			return { match: input === decoded, length: encoded.length };
		});

		console.log(
			`[${browserName}] TextEncoder non-ASCII:`,
			JSON.stringify(result),
		);
		expect(result.match).toBe(true);
		expect(result.length).toBeGreaterThan(0);
	});
});
