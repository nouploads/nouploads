import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Images to PDF — upload and create", () => {
	test("should create a PDF from a JPG image", async ({ page }) => {
		await page.goto("/image/to-pdf");
		await expect(
			page.getByText("Page Size", { exact: true }).first(),
		).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// File should appear in the list
		await expect(page.getByText("sample.jpg").first()).toBeVisible();

		// Click Create PDF
		const createButton = page.getByRole("button", { name: /create pdf/i });
		await expect(createButton).toBeVisible();
		await createButton.click();

		// Wait for the download button to appear (processing complete)
		const downloadButton = page.getByRole("button", {
			name: /download/i,
		});
		await expect(downloadButton).toBeVisible({ timeout: 15000 });
	});
});
