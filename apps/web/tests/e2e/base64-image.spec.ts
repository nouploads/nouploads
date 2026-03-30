import { expect, test } from "@playwright/test";

test.describe("Base64 Image Encoder/Decoder Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/base64-image", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText(
			"Base64 Image Encoder/Decoder",
		);
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Base64");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/base64-image");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("base64");
	});

	test("should display Encode and Decode tabs", async ({ page }) => {
		await expect(page.getByText("Encode Image to Base64")).toBeVisible();
		await expect(page.getByText("Decode Base64 to Image")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText("What is base64 encoding?")).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("FileReader API")).toBeVisible();
	});
});
