import { expect, test } from "@playwright/test";

test.describe("PDF Split Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/split");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Split PDF");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How do I split a PDF into separate pages?"),
		).toBeVisible();
		await expect(
			page.getByText("Why use NoUploads instead of other PDF split tools?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Split");
		expect(description).toContain("PDF");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/split");
	});
});
