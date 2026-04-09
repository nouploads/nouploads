import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Favicon Generator — upload happy path", () => {
	test("should generate a favicon from a PNG and show download button", async ({
		page,
	}) => {
		await page.goto("/image/favicon-generator");
		// Wait for lazy component to hydrate (dropzone proves React is ready)
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.png"));

		// Download button should appear after generation completes
		const downloadBtn = page.getByRole("button", { name: /download .ico/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		// Source image info should be visible
		await expect(page.getByText("Source Image")).toBeVisible();
		await expect(page.getByText("Result", { exact: true })).toBeVisible();

		// Size previews should be shown
		await expect(page.getByText("16x16", { exact: true })).toBeVisible();
		await expect(page.getByText("32x32", { exact: true })).toBeVisible();
		await expect(page.getByText("48x48", { exact: true })).toBeVisible();

		// Individual PNG download buttons should be available
		const pngButtons = page.getByRole("button", { name: /^PNG$/i });
		await expect(pngButtons).toHaveCount(3);

		// Reset button should be available
		await expect(
			page.getByRole("button", { name: /generate another/i }),
		).toBeVisible();
	});

	test("should generate a favicon from a JPG", async ({ page }) => {
		await page.goto("/image/favicon-generator");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Download button should appear
		const downloadBtn = page.getByRole("button", { name: /download .ico/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		// Size previews should be shown
		await expect(page.getByText("16x16", { exact: true })).toBeVisible();
		await expect(page.getByText("32x32", { exact: true })).toBeVisible();
		await expect(page.getByText("48x48", { exact: true })).toBeVisible();
	});
});
