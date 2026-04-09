import { expect, test } from "@playwright/test";

test.describe("HEIC to PNG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/heic-to-png");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("HEIC to PNG");
	});

	test("should display file dropzone that accepts multiple files", async ({
		page,
	}) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
		const input = page.locator('input[type="file"]');
		await expect(input).toHaveAttribute("multiple", "");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"What makes HEIC fundamentally different from traditional photo formats?",
			),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("HEIC");
		expect(description).toContain("PNG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/heic-to-png");
	});
});
