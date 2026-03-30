import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Watermark PDF — happy path", () => {
	test("should watermark a PDF file and show download button", async ({
		page,
	}) => {
		await page.goto("/pdf/watermark");
		// Wait for lazy component to hydrate (controls prove React is ready)
		await expect(page.getByText("Watermark Text")).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Verify size info is shown
		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Watermarked")).toBeVisible();
		await expect(page.getByText(/pages? watermarked/i)).toBeVisible();

		await expect(
			page.getByRole("button", { name: /watermark another/i }),
		).toBeVisible();
	});

	test("should reset and show dropzone when clicking Watermark another", async ({
		page,
	}) => {
		await page.goto("/pdf/watermark");
		await expect(page.getByText("Watermark Text")).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 30000,
		});

		await page.getByRole("button", { name: /watermark another/i }).click();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});
});
