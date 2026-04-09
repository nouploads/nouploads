import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Image Resize — upload happy path", () => {
	test("should resize a JPG and show download button", async ({ page }) => {
		await page.goto("/image/resize");
		// Wait for lazy component to hydrate (dropzone proves React is ready)
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Width/height inputs should appear
		await expect(page.locator("#resize-width")).toBeVisible({
			timeout: 10000,
		});
		await expect(page.locator("#resize-height")).toBeVisible();

		// Download button should appear after resize completes
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		// Result info should be visible
		await expect(page.getByText("Original", { exact: true })).toBeVisible();
		await expect(page.getByText("Result", { exact: true })).toBeVisible();

		// Reset button should be available
		await expect(
			page.getByRole("button", { name: /resize another/i }),
		).toBeVisible();
	});

	test("should resize a PNG with preset", async ({ page }) => {
		await page.goto("/image/resize");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.png"));

		// Wait for controls to appear
		await expect(page.locator("#resize-width")).toBeVisible({
			timeout: 10000,
		});

		// Click 50% preset
		await page.getByRole("radio", { name: "50%" }).click();

		// Download button should appear
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });
	});
});
