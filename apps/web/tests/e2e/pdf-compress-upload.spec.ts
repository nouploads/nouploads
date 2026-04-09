import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Compress PDF — upload flow", () => {
	test("should show warning when PDF cannot be compressed further", async ({
		page,
	}) => {
		await page.goto("/pdf/compress");
		await expect(
			page.getByText("Compression Level", { exact: true }),
		).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		// sample.pdf is a tiny text-only PDF — rasterizing to images makes it larger
		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for processing to complete — warning appears instead of download
		await expect(
			page.getByText(/couldn't be compressed further/i),
		).toBeVisible({ timeout: 30000 });

		// Download button should NOT appear when result is larger
		await expect(
			page.getByRole("button", { name: /download/i }),
		).not.toBeVisible();

		await expect(
			page.getByRole("button", { name: /compress another/i }),
		).toBeVisible();
	});

	test("should reset and show dropzone when clicking Compress another", async ({
		page,
	}) => {
		await page.goto("/pdf/compress");
		await expect(
			page.getByText("Compression Level", { exact: true }),
		).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for processing to finish (either success or warning)
		await expect(
			page.getByRole("button", { name: /compress another/i }),
		).toBeVisible({ timeout: 30000 });

		await page.getByRole("button", { name: /compress another/i }).click();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});
});
