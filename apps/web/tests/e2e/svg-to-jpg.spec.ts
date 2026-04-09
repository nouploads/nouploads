import { expect, test } from "@playwright/test";

test.describe("SVG to JPG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/svg-to-jpg");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("SVG to JPG");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Where does the SVG format come from?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("SVG");
		expect(description).toContain("JPG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/svg-to-jpg");
	});
});
