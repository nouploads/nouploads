import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("HEIC to JPG — invalid input", () => {
	test("should show error when given a non-HEIC file", async ({ page }) => {
		await page.goto("/image/heic-to-jpg");
		await expect(page.getByText("JPG Quality:")).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		// Force-upload a JPG (not HEIC) — heic2any will fail to decode it
		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Should show an error state (conversion fails on non-HEIC input)
		await expect(page.locator('[class*="destructive"]').first()).toBeVisible({
			timeout: 15000,
		});
	});
});
