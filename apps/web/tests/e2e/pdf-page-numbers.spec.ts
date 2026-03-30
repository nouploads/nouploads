import { expect, test } from "@playwright/test";

test.describe("PDF Page Numbers Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/page-numbers");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Page Numbers");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display page number controls", async ({ page }) => {
		await expect(page.getByText("Position")).toBeVisible();
		await expect(page.getByText("Format")).toBeVisible();
		await expect(page.getByText("Font Size")).toBeVisible();
		await expect(page.getByText("Margin")).toBeVisible();
		await expect(page.getByText("Start Number")).toBeVisible();
		await expect(page.getByText("Skip first page (title page)")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does the page numbering tool work?"),
		).toBeVisible();
		await expect(
			page.getByText("What page number formats are available?"),
		).toBeVisible();
		await expect(
			page.getByText(
				"Why use NoUploads instead of other PDF page numbering tools?",
			),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("page numbers");
		expect(description).toContain("PDF");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/page-numbers");
	});
});
