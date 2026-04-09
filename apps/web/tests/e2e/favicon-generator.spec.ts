import { expect, test } from "@playwright/test";

test.describe("Favicon Generator — page structure", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/favicon-generator");
	});

	test("should display tool heading and subtitle", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Favicon Generator");
		await expect(
			page.getByText(/generate multi-size .ico favicons/i),
		).toBeVisible();
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("What sizes are included in the generated favicon?"),
		).toBeVisible();
		await expect(
			page.getByText("How do I add the favicon to my website?"),
		).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("favicon");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/favicon-generator");
	});

	test("should display library attribution", async ({ page }) => {
		await expect(page.getByText(/Canvas API/)).toBeVisible();
	});
});
