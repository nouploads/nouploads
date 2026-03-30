import { expect, test } from "@playwright/test";

test.describe("PDF to JPG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/pdf-to-jpg");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("PDF to JPG");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display DPI selector", async ({ page }) => {
		await expect(page.getByText("Resolution")).toBeVisible();
	});

	test("should display quality slider for JPG", async ({ page }) => {
		await expect(page.getByText(/JPG Quality:/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does PDF to JPG conversion work?"),
		).toBeVisible();
		await expect(
			page.getByText("What DPI setting should I choose?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("PDF");
		expect(description).toContain("JPG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/pdf-to-jpg");
	});
});
