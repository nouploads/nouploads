import { expect, test } from "@playwright/test";

test.describe("PSB Converter Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/psb-converter");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert PSB");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Why did Adobe need a format bigger than PSD?"),
		).toBeVisible();
		await expect(
			page.getByText("How is PSB different from PSD?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("PSB");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/psb-converter");
	});
});
