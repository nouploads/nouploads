import { expect, test } from "@playwright/test";

test.describe("PDF Merge Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/merge");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Merge PDFs");
	});

	test("should display file dropzone that accepts multiple files", async ({
		page,
	}) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
		const input = page.locator('input[type="file"]');
		await expect(input).toHaveAttribute("multiple", "");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("How do I merge PDF files?")).toBeVisible();
		await expect(
			page.getByText("Why use NoUploads instead of other PDF merge tools?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("PDF");
		expect(description).toContain("merge");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/merge");
	});
});
