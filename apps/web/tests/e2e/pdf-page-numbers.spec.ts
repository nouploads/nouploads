import { expect, test } from "@playwright/test";

test.describe("PDF Page Numbers Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/page-numbers");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Page Numbers");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display page number controls", async ({ page }) => {
		// Wait for lazy component to hydrate
		await expect(page.getByText("Position", { exact: true })).toBeVisible({
			timeout: 10000,
		});
		await expect(page.getByText("Format", { exact: true })).toBeVisible();
		await expect(page.getByText("Font Size").first()).toBeVisible();
		await expect(page.getByText("Margin").first()).toBeVisible();
		await expect(page.getByText("Start Number")).toBeVisible();
		await expect(page.getByText("Skip first page (title page)")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("What's the story behind page numbering in books?"),
		).toBeVisible();
		await expect(
			page.getByText("What page number formats are available?"),
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
