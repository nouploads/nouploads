import { expect, test } from "@playwright/test";

test.describe("HEIC to JPG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/heic-to-jpg");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("HEIC to JPG");
	});

	test("should display file dropzone that accepts multiple files", async ({
		page,
	}) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
		const input = page.locator('input[type="file"]');
		await expect(input).toHaveAttribute("multiple", "");
	});

	test("should display quality slider", async ({ page }) => {
		await expect(page.getByText(/JPG Quality:/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Where does the HEIF image standard come from?"),
		).toBeVisible();
		await expect(
			page.getByText("What output quality should I use for HEIC to JPG?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("HEIC");
		expect(description).toContain("JPG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/heic-to-jpg");
	});
});
