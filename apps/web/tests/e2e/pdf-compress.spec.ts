import { expect, test } from "@playwright/test";

test.describe("Compress PDF Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/compress");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Compress PDF");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display compression level selector", async ({ page }) => {
		await expect(page.getByText("Compression Level")).toBeVisible();
		await expect(page.getByText("Medium (balanced)")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does PDF compression work?"),
		).toBeVisible();
		await expect(
			page.getByText("Will the compressed PDF look different?"),
		).toBeVisible();
		await expect(
			page.getByText("Which compression level should I choose?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("PDF");
		expect(description).toContain("compress");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/compress");
	});
});
