import { expect, test } from "@playwright/test";

test.describe("PDF to Text Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/pdf-to-text");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("PDF to Text");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does PDF actually store text internally?"),
		).toBeVisible();
		await expect(
			page.getByText("What if my PDF contains only scanned images?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("PDF");
		expect(description).toContain("text");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/pdf-to-text");
	});
});
