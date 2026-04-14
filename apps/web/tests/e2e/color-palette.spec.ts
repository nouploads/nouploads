import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Color Palette Extractor Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/color-palette");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Color Palette Extractor");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"What is the story behind the median-cut color quantization algorithm?",
			),
		).toBeVisible();
		await expect(
			page.getByText(
				"How does the palette extractor decide which colors are dominant?",
			),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("dominant colors");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/color-palette");
	});

	test("should surface an error when a non-image file is uploaded", async ({
		page,
	}) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
		// PDF is not an image — createImageBitmap should reject it
		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		await expect(page.locator(".text-destructive").first()).toBeVisible({
			timeout: 15000,
		});
	});
});
