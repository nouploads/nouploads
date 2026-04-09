import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("ICO to WebP Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/ico-to-webp");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert ICO to WebP");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"Why do ICO files contain multiple images instead of just one?",
			),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("ICO");
		expect(description).toContain("WebP");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/ico-to-webp");
	});
});

test.describe("ICO to WebP — upload happy path", () => {
	test("should convert ICO to WebP and show download", async ({ page }) => {
		await page.goto("/image/ico-to-webp");
		await expect(page.getByText("Output format:")).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.ico"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });
	});
});
