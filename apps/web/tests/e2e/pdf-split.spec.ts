import { expect, test } from "@playwright/test";

test.describe("PDF Split Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/split");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Split PDF");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("What makes PDF easy to split without losing quality?"),
		).toBeVisible();
		await expect(
			page.getByText("Can I extract specific page ranges from a PDF?"),
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
