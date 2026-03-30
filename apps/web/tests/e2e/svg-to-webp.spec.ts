import { expect, test } from "@playwright/test";

test.describe("SVG to WebP Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/svg-to-webp");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("SVG to WebP");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("What is WebP and why use it for SVG conversion?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("SVG");
		expect(description).toContain("WebP");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/svg-to-webp");
	});
});
