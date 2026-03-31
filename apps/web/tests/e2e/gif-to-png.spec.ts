import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("GIF to PNG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/gif-to-png");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert GIF to PNG");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"How did a patent dispute reshape GIF's place on the web?",
			),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("GIF");
		expect(description).toContain("PNG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/gif-to-png");
	});
});

test.describe("GIF to PNG — upload happy path", () => {
	test("should convert GIF to PNG with frame selector", async ({ page }) => {
		await page.goto("/image/gif-to-png");
		await expect(page.getByText("Output format:")).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.gif"));

		// Wait for frame selector to appear (filmstrip with frame thumbnails)
		await expect(page.getByText("Select frame")).toBeVisible({
			timeout: 10000,
		});
		await expect(page.getByText(/Frame \d+ \/ \d+/)).toBeVisible();

		// Wait for download button (conversion complete)
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });
	});
});
