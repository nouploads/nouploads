import { expect, test } from "@playwright/test";

test.describe("PDF to PNG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/pdf-to-png");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("PDF to PNG");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display DPI selector", async ({ page }) => {
		await expect(page.getByText("Resolution", { exact: true })).toBeVisible({
			timeout: 10000,
		});
	});

	test("should not display quality slider for PNG", async ({ page }) => {
		await expect(page.getByText(/JPG Quality/i)).not.toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Why choose PNG over JPG for PDF pages?"),
		).toBeVisible();
		await expect(
			page.getByText("What resolution should I pick?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("PDF");
		expect(description).toContain("PNG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/pdf-to-png");
	});
});
