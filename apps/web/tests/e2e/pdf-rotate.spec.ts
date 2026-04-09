import { expect, test } from "@playwright/test";

test.describe("PDF Rotate Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/rotate");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Rotate PDF");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display rotation selector", async ({ page }) => {
		await expect(
			page.getByText("Rotation", { exact: true }).first(),
		).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does PDF handle page rotation internally?"),
		).toBeVisible();
		await expect(
			page.getByText("Can I rotate individual pages?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("PDF");
		expect(description).toContain("otate");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/rotate");
	});
});
