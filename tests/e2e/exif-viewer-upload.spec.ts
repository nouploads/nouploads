import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("EXIF Viewer — upload and view metadata", () => {
	test("should display metadata after uploading a JPG", async ({ page }) => {
		await page.goto("/image/exif");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// File name should appear
		await expect(page.getByText("sample.jpg")).toBeVisible();

		// Wait for metadata to be parsed — either a tab or "No metadata" message
		await expect(
			page.getByText("Camera").or(page.getByText("No metadata found")),
		).toBeVisible({ timeout: 10000 });

		// Strip button should be visible if metadata exists
		const stripButton = page.getByRole("button", {
			name: /strip metadata/i,
		});
		const noMetadata = page.getByText("No metadata found in this image");

		// One of these should be visible
		await expect(stripButton.or(noMetadata)).toBeVisible({ timeout: 10000 });
	});
});
