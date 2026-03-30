import { expect, test } from "@playwright/test";

test.describe("Image Filters Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/filters");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Image Filters");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("What filters can I apply to my images?"),
		).toBeVisible();
		await expect(
			page.getByText("Are there one-click presets available?"),
		).toBeVisible();
		await expect(
			page.getByText("Why use NoUploads instead of other image filter tools?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("grayscale");
		expect(description).toContain("image");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/filters");
	});
});
