import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/", { waitUntil: "networkidle" });
	});

	test("should display hero section", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Privacy-first file tools");
		await expect(page.locator("h1")).toContainText(
			"Everything runs in your browser",
		);
	});

	test("should display privacy badges", async ({ page }) => {
		await expect(page.getByText("No uploads")).toBeVisible();
		await expect(page.getByText("Free & open source")).toBeVisible();
		await expect(page.getByText("Works offline")).toBeVisible();
	});

	test("should display all tools in the grid", async ({ page }) => {
		await expect(page.getByText("Image Convert")).toBeVisible();
		await expect(page.getByText("Image Compress")).toBeVisible();
		await expect(page.getByText("Image Resize")).toBeVisible();
		await expect(page.getByText("EXIF Viewer")).toBeVisible();
		await expect(page.getByText("Images to PDF")).toBeVisible();
		await expect(page.getByText("Color Picker")).toBeVisible();
	});

	test('should display "How it works" section', async ({ page }) => {
		await expect(page.getByText("How it works")).toBeVisible();
		await expect(page.getByText("Choose a tool")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Drop your files" }),
		).toBeVisible();
		await expect(page.getByText("Download results")).toBeVisible();
	});

	test("should have header with logo and GitHub link", async ({ page }) => {
		const header = page.locator("header");
		await expect(header.getByText("NoUploads")).toBeVisible();
		await expect(header.locator('a[href*="github"]')).toBeVisible();
	});

	test("should have footer", async ({ page }) => {
		await expect(page.locator("footer")).toBeVisible();
	});
});
