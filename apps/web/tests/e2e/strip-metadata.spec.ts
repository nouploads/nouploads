import { expect, test } from "@playwright/test";

test.describe("Strip Metadata Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/strip-metadata");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("EXIF Metadata Remover");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"What is the history behind the EXIF standard embedded in photos?",
			),
		).toBeVisible();
		await expect(
			page.getByText(
				"How does Canvas re-encoding remove metadata from an image?",
			),
		).toBeVisible();
		await expect(
			page.getByText(
				"Which specific metadata fields does this tool strip from photos?",
			),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Strip GPS");
		expect(description).toContain("metadata");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/strip-metadata");
	});
});
