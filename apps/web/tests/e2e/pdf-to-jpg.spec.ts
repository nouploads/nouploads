import { expect, test } from "@playwright/test";

test.describe("PDF to JPG Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/pdf-to-jpg");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("PDF to JPG");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display DPI selector", async ({ page }) => {
		await expect(page.getByText("Resolution", { exact: true })).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display quality slider for JPG", async ({ page }) => {
		await expect(page.getByText(/JPG Quality/i).first()).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Why was PDF invented in the first place?"),
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
