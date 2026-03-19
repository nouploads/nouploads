import { expect, test } from "@playwright/test";

test.describe("Convert Images — universal page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/convert");
	});

	test("should display tool heading and format selector", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert Images");
		await expect(page.getByText("Output format:")).toBeVisible();
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Which image formats can I convert between?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Convert");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/convert");
	});
});

test.describe("JPG to PNG — landing page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/jpg-to-png");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert JPG to PNG");
	});

	test("should have unique meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("JPG");
		expect(description).toContain("PNG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/jpg-to-png");
	});

	test("should display format-specific FAQ", async ({ page }) => {
		await expect(page.getByText("Why convert JPG to PNG?")).toBeVisible();
	});
});
