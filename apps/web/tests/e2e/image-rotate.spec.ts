import { expect, test } from "@playwright/test";

test.describe("Image Rotate — page structure", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/rotate");
	});

	test("should display tool heading and subtitle", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Image Rotate");
		await expect(page.getByText(/rotate images by 90/i)).toBeVisible();
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("What is the difference between rotating and flipping?"),
		).toBeVisible();
		await expect(
			page.getByText("Can I apply multiple transforms in a row?"),
		).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Rotate");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/rotate");
	});

	test("should display library attribution", async ({ page }) => {
		await expect(page.getByText(/Canvas API/)).toBeVisible();
	});
});
