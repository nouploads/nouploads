import { expect, test } from "@playwright/test";

test.describe("Image Crop — page structure", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/crop");
	});

	test("should display tool heading and subtitle", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Image Crop");
		await expect(
			page.getByText(/crop images with a visual editor/i),
		).toBeVisible();
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Can I crop to a specific aspect ratio?"),
		).toBeVisible();
		await expect(
			page.getByText("Does cropping reduce image quality?"),
		).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Crop");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/crop");
	});

	test("should display library attribution", async ({ page }) => {
		await expect(page.getByText(/Canvas API/)).toBeVisible();
	});
});
