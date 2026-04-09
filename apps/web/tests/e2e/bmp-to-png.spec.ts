import { expect, test } from "@playwright/test";

test.describe("BMP to PNG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/bmp-to-png");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert BMP to PNG");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"How did BMP become the default image format on early Windows?",
			),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("BMP");
		expect(description).toContain("PNG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/bmp-to-png");
	});
});
