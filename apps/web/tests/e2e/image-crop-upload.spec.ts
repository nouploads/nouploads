import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Image Crop — upload happy path", () => {
	test("should crop a JPG and show download button", async ({ page }) => {
		await page.goto("/image/crop");
		// Wait for lazy component to hydrate (dropzone proves React is ready)
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Aspect ratio presets should appear
		await expect(page.getByRole("radio", { name: "Free" })).toBeVisible({
			timeout: 10000,
		});
		await expect(page.getByRole("radio", { name: "1:1" })).toBeVisible();

		// Apply crop button should be visible
		const applyBtn = page.getByRole("button", { name: /apply crop/i });
		await expect(applyBtn).toBeVisible({ timeout: 10000 });

		// Click apply crop
		await applyBtn.click();

		// Download button should appear after crop completes
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		// Result info should be visible
		await expect(page.getByText("Original", { exact: true })).toBeVisible();
		await expect(page.getByText("Cropped", { exact: true })).toBeVisible();

		// Crop more and Start over buttons
		await expect(
			page.getByRole("button", { name: /crop more/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /start over/i }),
		).toBeVisible();
	});

	test("should crop a PNG with 1:1 aspect ratio", async ({ page }) => {
		await page.goto("/image/crop");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.png"));

		// Wait for controls
		await expect(page.getByRole("radio", { name: "1:1" })).toBeVisible({
			timeout: 10000,
		});

		// Select 1:1 aspect
		await page.getByRole("radio", { name: "1:1" }).click();

		// Apply crop
		const applyBtn = page.getByRole("button", { name: /apply crop/i });
		await expect(applyBtn).toBeVisible();
		await applyBtn.click();

		// Download should appear
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });
	});
});
