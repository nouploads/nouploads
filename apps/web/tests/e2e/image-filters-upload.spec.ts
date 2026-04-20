import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Image Filters — happy path", () => {
	test("should apply filters to an image and show download button", async ({
		page,
	}) => {
		await page.goto("/image/filters");
		// Wait for lazy component to hydrate
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// After upload, filter sliders and presets should be visible
		await expect(page.getByText("Brightness:")).toBeVisible();
		await expect(page.getByText("Contrast:")).toBeVisible();

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Verify result label is shown
		await expect(page.getByText("Result")).toBeVisible();

		await expect(
			page.getByRole("button", { name: /choose another/i }),
		).toBeVisible();
	});

	test("should produce grayscale pixels when Grayscale preset is applied", async ({
		page,
	}) => {
		await page.goto("/image/filters");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));
		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 30000,
		});

		// Apply Grayscale preset
		await page.getByRole("button", { name: "Grayscale" }).click();
		// Wait for reprocessing
		await page.waitForTimeout(3000);

		// Sample the result image — R, G, B channels should be near-equal
		const result = await page.evaluate(() => {
			const img = document.querySelector(
				'img[alt="Result"]',
			) as HTMLImageElement | null;
			if (!img) return null;
			const c = document.createElement("canvas");
			c.width = img.naturalWidth;
			c.height = img.naturalHeight;
			const ctx = c.getContext("2d");
			if (!ctx) return null;
			ctx.drawImage(img, 0, 0);
			// Sample 5 pixels at different positions
			const positions = [
				[10, 10],
				[50, 50],
				[100, 30],
				[30, 80],
				[70, 70],
			];
			return positions.map(([x, y]) => {
				const d = ctx.getImageData(x, y, 1, 1).data;
				return { r: d[0], g: d[1], b: d[2] };
			});
		});

		if (!result) throw new Error("result should be populated");
		for (const px of result) {
			// In a grayscale image, R ≈ G ≈ B (allow small rounding differences)
			expect(Math.abs(px.r - px.g)).toBeLessThanOrEqual(2);
			expect(Math.abs(px.g - px.b)).toBeLessThanOrEqual(2);
		}
	});

	test("should show preset buttons after file upload", async ({ page }) => {
		await page.goto("/image/filters");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Preset buttons should be visible
		await expect(page.getByRole("button", { name: "Grayscale" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Sepia" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Reset All" })).toBeVisible();
	});

	test("should reset and show dropzone when clicking Choose another", async ({
		page,
	}) => {
		await page.goto("/image/filters");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 30000,
		});

		await page.getByRole("button", { name: /choose another/i }).click();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});
});
