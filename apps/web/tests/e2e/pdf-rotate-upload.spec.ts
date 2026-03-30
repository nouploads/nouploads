import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF Rotate — upload and rotate", () => {
	test("should rotate a PDF and offer download", async ({ page }) => {
		await page.goto("/pdf/rotate");
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		// Upload sample PDF
		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for download button to appear (rotation complete)
		const downloadButton = page.getByRole("button", {
			name: /download/i,
		});
		await expect(downloadButton).toBeVisible({ timeout: 15000 });

		// Verify result info is shown
		await expect(page.getByText(/rotated/i)).toBeVisible();
	});
});
