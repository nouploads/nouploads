import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF to Text — upload flow", () => {
	test("should extract text from a PDF and show copy/download buttons", async ({
		page,
	}) => {
		await page.goto("/pdf/pdf-to-text");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for extraction to complete — the "Copy to clipboard" button appears
		await expect(
			page.getByRole("button", { name: /copy to clipboard/i }),
		).toBeVisible({ timeout: 30000 });

		// Download button should also be visible
		await expect(
			page.getByRole("button", { name: /download as \.txt/i }),
		).toBeVisible();

		// Should show page count
		await expect(page.locator("text=/\\d+ page/")).toBeVisible();

		// Should show character count
		await expect(page.locator("text=/\\d+ characters/")).toBeVisible();

		// The textarea should contain text
		const textarea = page.locator("textarea");
		await expect(textarea).toBeVisible();
		const value = await textarea.inputValue();
		expect(value.length).toBeGreaterThan(0);
		expect(value).toContain("--- Page 1 ---");
	});
});

test.describe("PDF to Text — invalid input", () => {
	test("should show error when given a non-PDF file", async ({ page }) => {
		await page.goto("/pdf/pdf-to-text");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		// Force-upload a JPG (not a PDF) — pdf.js will fail to parse it
		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Should show an error state
		await expect(page.locator('[class*="destructive"]').first()).toBeVisible({
			timeout: 15000,
		});
	});
});
