import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF Reorder — upload and reorder", () => {
	test("should upload a PDF and show thumbnails with download option", async ({
		page,
	}) => {
		await page.goto("/pdf/reorder");
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});

		// Upload sample PDF
		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for thumbnails to appear (page rendering complete)
		// The page number badges should be visible
		await expect(page.locator('img[alt="Page 1"]')).toBeVisible({
			timeout: 15000,
		});

		// The build/download button should be visible
		const downloadButton = page.getByRole("button", {
			name: /download|build/i,
		});
		await expect(downloadButton).toBeVisible({ timeout: 5000 });
	});
});
