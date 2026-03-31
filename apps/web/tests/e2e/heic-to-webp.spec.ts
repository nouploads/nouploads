import { expect, test } from "@playwright/test";

test.describe("HEIC to WebP Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/heic-to-webp");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("HEIC to WebP");
	});

	test("should display file dropzone and quality slider", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
		await expect(page.getByText(/WebP Quality:/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How do HEIC and WebP compare as modern image formats?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("HEIC");
		expect(description).toContain("WebP");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/heic-to-webp");
	});
});
