import { expect, test } from "@playwright/test";

test.describe("PDF Reorder Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/reorder");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Reorder PDF Pages");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(/original purpose of the PDF format/i),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("rearrange");
		expect(description).toContain("PDF");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/reorder");
	});
});
