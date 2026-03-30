import { expect, test } from "@playwright/test";

test.describe("Image Watermark — page structure", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/watermark");
	});

	test("should display tool heading and subtitle", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Image Watermark");
		await expect(
			page.getByText(/add text watermarks to images/i),
		).toBeVisible();
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"What is the difference between centered and tiled watermarks?",
			),
		).toBeVisible();
		await expect(
			page.getByText("Why use NoUploads instead of other watermark tools?"),
		).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("watermark");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/watermark");
	});

	test("should display library attribution", async ({ page }) => {
		await expect(page.getByText(/Canvas API/)).toBeVisible();
	});
});
