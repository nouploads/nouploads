import { expect, test } from "@playwright/test";

test.describe("BMP to JPG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/bmp-to-jpg");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert BMP to JPG");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Why are BMP files so much larger than JPG?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("BMP");
		expect(description).toContain("JPG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/bmp-to-jpg");
	});
});
