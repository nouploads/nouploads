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
		await expect(
			page.getByRole("tab", { name: /Encode Image to Base64/ }),
		).toBeVisible();
		await expect(
			page.getByRole("tab", { name: /Decode Base64 to Image/ }),
		).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		const faqHeading = page.getByRole("heading", {
			name: "Frequently Asked Questions",
		});
		await faqHeading.scrollIntoViewIfNeeded();
		await expect(faqHeading).toBeVisible();
		await expect(
			page.getByText(/Where does Base64 encoding come from/),
		).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(
			page.getByRole("link", { name: "FileReader API" }),
		).toBeVisible();
	});
});
