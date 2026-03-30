import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF to PNG — upload flow", () => {
	test("should convert a PDF and show download button", async ({ page }) => {
		await page.goto("/pdf/pdf-to-png");
		await expect(page.getByText("Resolution")).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for at least one download button to appear (conversion complete)
		await expect(
			page.getByRole("button", { name: /download/i }).first(),
		).toBeVisible({ timeout: 30000 });
	});
});

test.describe("PDF to PNG — invalid input", () => {
	test("should show error when given a non-PDF file", async ({ page }) => {
		await page.goto("/pdf/pdf-to-png");
		await expect(page.getByText("Resolution")).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		// Force-upload a JPG (not a PDF) — pdf.js will fail to parse it
		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Should show an error state
		await expect(page.locator('[class*="destructive"]').first()).toBeVisible({
			timeout: 15000,
		});
	});
});
