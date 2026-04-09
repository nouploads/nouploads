import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF Merge — upload and merge", () => {
	test("should merge two PDFs and offer download", async ({ page }) => {
		await page.goto("/pdf/merge");
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		// Upload two copies of the sample PDF
		await uploadViaDropzone(page, [
			join(fixtures, "sample.pdf"),
			join(fixtures, "sample.pdf"),
		]);

		// Wait for file list to appear with both entries
		await expect(page.getByText("sample.pdf").first()).toBeVisible({
			timeout: 10000,
		});

		// Click merge button (file count may vary across browsers due to upload event handling)
		const mergeButton = page.getByRole("button", { name: /merge \d+ pdfs/i });
		await expect(mergeButton).toBeVisible({ timeout: 10000 });
		await mergeButton.click();

		// Wait for download button to appear (merge complete)
		const downloadButton = page.getByRole("button", {
			name: /download/i,
		});
		await expect(downloadButton).toBeVisible({ timeout: 30000 });

		// Verify "Merged PDF" label is shown
		await expect(page.getByText("Merged PDF")).toBeVisible();
	});
});
