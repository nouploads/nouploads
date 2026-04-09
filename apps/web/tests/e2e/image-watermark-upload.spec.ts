import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Image Watermark — upload happy path", () => {
	test("should watermark a JPG and show download button", async ({ page }) => {
		await page.goto("/image/watermark");
		// Wait for lazy component to hydrate (dropzone proves React is ready)
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Text input should appear with default value
		await expect(page.locator("#watermark-text")).toBeVisible({
			timeout: 10000,
		});
		await expect(page.locator("#watermark-text")).toHaveValue("SAMPLE");

		// Download button should appear after processing completes
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		// Result info should be visible
		await expect(page.getByText("Original", { exact: true })).toBeVisible();
		await expect(page.getByText("Result", { exact: true })).toBeVisible();

		// Reset button should be available
		await expect(
			page.getByRole("button", { name: /watermark another/i }),
		).toBeVisible();
	});

	test("should watermark a PNG with tiled mode", async ({ page }) => {
		await page.goto("/image/watermark");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.png"));

		// Wait for controls to appear
		await expect(page.locator("#watermark-text")).toBeVisible({
			timeout: 10000,
		});

		// Switch to tiled mode
		await page.getByRole("radio", { name: "Tiled" }).click();

		// Download button should appear
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });
	});
});
