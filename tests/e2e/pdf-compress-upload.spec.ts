import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Compress PDF — happy path", () => {
	test("should compress a PDF file and show download button", async ({
		page,
	}) => {
		await page.goto("/pdf/compress");
		// Wait for lazy component to hydrate (compression level selector proves React is ready)
		await expect(page.getByText("Compression Level")).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Verify size comparison is shown
		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Compressed")).toBeVisible();
		await expect(page.getByText(/pages? processed/i)).toBeVisible();

		await expect(
			page.getByRole("button", { name: /compress another/i }),
		).toBeVisible();
	});

	test("should reset and show dropzone when clicking Compress another", async ({
		page,
	}) => {
		await page.goto("/pdf/compress");
		await expect(page.getByText("Compression Level")).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 30000,
		});

		await page.getByRole("button", { name: /compress another/i }).click();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});
});
