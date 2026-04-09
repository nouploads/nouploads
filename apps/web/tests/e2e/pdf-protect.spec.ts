import { expect, test } from "@playwright/test";

test.describe("PDF Protect Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/protect");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Protect PDF");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display password input fields", async ({ page }) => {
		await expect(
			page.getByText("User Password (required to open)"),
		).toBeVisible();
		await expect(
			page.getByText("Owner Password (required to change permissions)"),
		).toBeVisible();
	});

	test("should display permission checkboxes", async ({ page }) => {
		await expect(page.getByText("Allow printing")).toBeVisible();
		await expect(page.getByText("Allow copying")).toBeVisible();
		await expect(page.getByText("Allow editing")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How did PDF encryption evolve over the years?"),
		).toBeVisible();
		await expect(
			page.getByText(
				"What is the difference between user and owner passwords?",
			),
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
		expect(canonical).toContain("/pdf/protect");
	});
});
