import { expect, test } from "@playwright/test";

test.describe("PDF Unlock Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/unlock");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Unlock PDF");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does this PDF unlock tool work?"),
		).toBeVisible();
		await expect(
			page.getByText("Do I need to know the password to unlock the PDF?"),
		).toBeVisible();
		await expect(
			page.getByText("Why use NoUploads instead of other PDF unlock tools?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("password");
		expect(description).toContain("PDF");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/unlock");
	});
});
