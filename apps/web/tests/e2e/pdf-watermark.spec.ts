import { expect, test } from "@playwright/test";

test.describe("Watermark PDF Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/watermark");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Watermark PDF");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display watermark controls", async ({ page }) => {
		await expect(page.getByText("Watermark Text")).toBeVisible();
		await expect(page.getByText("Font Size")).toBeVisible();
		await expect(page.getByText("Opacity")).toBeVisible();
		await expect(page.getByText("Rotation")).toBeVisible();
		await expect(page.getByText("Color")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does the PDF watermark tool work?"),
		).toBeVisible();
		await expect(
			page.getByText("Can I customize the watermark appearance?"),
		).toBeVisible();
		await expect(
			page.getByText("Does the watermark appear on every page?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("watermark");
		expect(description).toContain("PDF");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/watermark");
	});
});
