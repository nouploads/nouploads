import { expect, test } from "@playwright/test";

test.describe("EXIF Viewer Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/exif");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("EXIF Viewer");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("What is EXIF data?")).toBeVisible();
		await expect(
			page.getByText("What types of metadata can this tool read?"),
		).toBeVisible();
		await expect(
			page.getByText("Why use NoUploads instead of other EXIF viewers?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("EXIF");
		expect(description).toContain("metadata");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/exif");
	});
});
