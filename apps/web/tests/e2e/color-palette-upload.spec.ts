import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Color Palette Extractor — upload and extract", () => {
	test("should extract colors after uploading a JPG", async ({ page }) => {
		await page.goto("/image/color-palette");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// File name should appear
		await expect(page.getByText("sample.jpg")).toBeVisible();

		// Wait for palette to render — look for swatch elements
		const swatchLocator = page.locator('[style*="background-color"]').first();
		await expect(swatchLocator).toBeVisible({ timeout: 15000 });

		// Verify the color table headers are present (use exact role selectors)
		await expect(page.getByRole("columnheader", { name: "Hex" })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: "RGB" })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: "HSL" })).toBeVisible();

		// Verify export buttons exist
		await expect(
			page.getByRole("button", { name: /copy as css variables/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /copy as tailwind/i }),
		).toBeVisible();
	});
});
