import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Image Rotate — upload happy path", () => {
	test("should rotate a JPG and show download button", async ({ page }) => {
		await page.goto("/image/rotate");
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// Action buttons should appear
		await expect(
			page.getByRole("button", { name: /rotate right/i }),
		).toBeVisible({ timeout: 10000 });
		await expect(
			page.getByRole("button", { name: /rotate left/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /flip horizontal/i }),
		).toBeVisible();

		// Click Rotate Right
		await page.getByRole("button", { name: /rotate right/i }).click();

		// Download button should appear after processing
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		// Original info should be visible
		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Result")).toBeVisible();

		// Reset and Choose another buttons
		await expect(page.getByRole("button", { name: /reset/i })).toBeVisible();
		await expect(
			page.getByRole("button", { name: /choose another/i }),
		).toBeVisible();
	});

	test("should chain multiple transforms", async ({ page }) => {
		await page.goto("/image/rotate");
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.png"));

		// Wait for buttons
		await expect(
			page.getByRole("button", { name: /rotate right/i }),
		).toBeVisible({ timeout: 10000 });

		// Apply first transform
		await page.getByRole("button", { name: /rotate right/i }).click();
		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 15000,
		});

		// Apply second transform (flip)
		await page.getByRole("button", { name: /flip horizontal/i }).click();

		// Download should still be available after second transform
		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 15000,
		});
	});
});
