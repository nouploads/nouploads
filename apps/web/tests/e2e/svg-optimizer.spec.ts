import { expect, test } from "@playwright/test";

test.describe("SVG Optimizer Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/vector/svg-optimizer");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("SVG Optimizer");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("What does SVG optimization do?"),
		).toBeVisible();
		await expect(
			page.getByText("Does optimization change how my SVG looks?"),
		).toBeVisible();
		await expect(
			page.getByText("Why use NoUploads instead of other SVG optimizer tools?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("SVG");
		expect(description).toContain("optimize");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/vector/svg-optimizer");
	});
});
