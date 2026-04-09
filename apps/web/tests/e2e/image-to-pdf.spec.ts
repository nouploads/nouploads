import { expect, test } from "@playwright/test";

test.describe("Images to PDF Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/to-pdf");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Images to PDF");
	});

	test("should display file dropzone that accepts multiple files", async ({
		page,
	}) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
		const input = page.locator('input[type="file"]');
		await expect(input).toHaveAttribute("multiple", "");
	});

	test("should display page size selector", async ({ page }) => {
		await expect(
			page.getByText("Page Size", { exact: true }).first(),
		).toBeVisible();
		await expect(page.getByText("Fit to Image")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does PDF actually store images internally?"),
		).toBeVisible();
		await expect(
			page.getByText("Can I reorder images before creating the PDF?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("images");
		expect(description).toContain("PDF");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/to-pdf");
	});
});
