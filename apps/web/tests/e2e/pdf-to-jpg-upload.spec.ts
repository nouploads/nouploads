import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF to JPG — upload flow", () => {
	test("should convert a PDF and show download button", async ({ page }) => {
		await page.goto("/pdf/pdf-to-jpg");
		await expect(page.getByText("Resolution", { exact: true })).toBeVisible({
			timeout: 10000,
		});
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for at least one download button to appear (conversion complete)
		await expect(
			page.getByRole("button", { name: /download/i }).first(),
		).toBeVisible({ timeout: 30000 });
	});
});

test.describe("PDF to JPG — quality change re-processes", () => {
	test("should re-convert when quality slider changes after results", async ({
		page,
	}) => {
		await page.goto("/pdf/pdf-to-jpg");
		await expect(page.getByText("Resolution", { exact: true })).toBeVisible({
			timeout: 10000,
		});

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for conversion to complete
		const downloadBtn = page.getByRole("button", { name: /download/i }).first();
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Change quality slider — drag it to a different position
		const slider = page.getByRole("slider");
		await slider.focus();
		// Press ArrowLeft multiple times to significantly lower quality
		for (let i = 0; i < 30; i++) {
			await slider.press("ArrowLeft");
		}

		// Should re-enter processing state (download button disappears, then reappears)
		await expect(downloadBtn).not.toBeVisible({ timeout: 5000 });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });
	});
});

test.describe("PDF to JPG — invalid input", () => {
	test("should show error when given a non-PDF file", async ({ page }) => {
		await page.goto("/pdf/pdf-to-jpg");
		await expect(page.getByText("Resolution", { exact: true })).toBeVisible({
			timeout: 10000,
		});
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		// Force-upload a JPG (not a PDF) — pdf.js will fail to parse it
		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Should show an error state
		await expect(page.locator('[class*="destructive"]').first()).toBeVisible({
			timeout: 15000,
		});
	});
});
