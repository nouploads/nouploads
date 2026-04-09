import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF Split — upload and split", () => {
	test("should split a PDF into individual pages and offer downloads", async ({
		page,
	}) => {
		await page.goto("/pdf/split");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		// Upload sample PDF
		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for file info to appear with page count
		await expect(page.getByText("sample.pdf")).toBeVisible({
			timeout: 10000,
		});

		// Wait for page count to load (should show "X pages" in the file info)
		await expect(
			page.locator(".text-xs.text-muted-foreground").getByText(/\d+ pages?/),
		).toBeVisible({
			timeout: 10000,
		});

		// "Individual pages" mode should be selected by default
		// Click the split button
		const splitButton = page.getByRole("button", {
			name: /split into \d+ pages?/i,
		});
		await expect(splitButton).toBeVisible({ timeout: 5000 });
		await splitButton.click();

		// Wait for at least one download button to appear (split complete)
		const downloadButton = page
			.getByRole("button", { name: /download/i })
			.first();
		await expect(downloadButton).toBeVisible({ timeout: 15000 });

		// Verify "files ready" label is shown
		await expect(page.getByText(/\d+ files? ready/)).toBeVisible();
	});

	test("should clear results when switching split modes", async ({ page }) => {
		await page.goto("/pdf/split");
		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Wait for page count to load
		await expect(
			page.locator(".text-xs.text-muted-foreground").getByText(/\d+ pages?/),
		).toBeVisible({ timeout: 10000 });

		// Split in individual mode
		const splitButton = page.getByRole("button", {
			name: /split into \d+ pages?/i,
		});
		await splitButton.click();
		await expect(page.getByText(/\d+ files? ready/)).toBeVisible({
			timeout: 15000,
		});

		// Switch to custom mode — old results should disappear
		await page.getByRole("button", { name: /custom ranges/i }).click();
		await expect(page.getByText(/\d+ files? ready/)).not.toBeVisible();

		// Split button area should be visible again (not hidden by stale results)
		await expect(
			page.getByRole("button", { name: /split pdf/i }),
		).toBeVisible();
	});
});
