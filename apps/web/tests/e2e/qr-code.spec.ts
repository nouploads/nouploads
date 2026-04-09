import { expect, test } from "@playwright/test";

test.describe("QR Code Generator Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/qr-code", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("QR Code Generator");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("QR Code Generator");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/qr-code");
	});

	test("should display text input area", async ({ page }) => {
		const textarea = page.locator("#qr-text");
		await expect(textarea).toBeVisible();
	});

	test("should display size selector", async ({ page }) => {
		await expect(page.locator('[aria-label="QR code size"]')).toBeVisible();
	});

	test("should display error correction selector", async ({ page }) => {
		await expect(
			page.locator('[aria-label="Error correction level"]'),
		).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		const faqHeading = page.getByRole("heading", {
			name: "Frequently Asked Questions",
		});
		await faqHeading.scrollIntoViewIfNeeded();
		await expect(faqHeading).toBeVisible();
		await expect(page.getByText(/story behind QR codes/)).toBeVisible();
	});

	test("should display library attribution", async ({ page }) => {
		await expect(page.getByText("qrcode")).toBeVisible();
		await expect(page.getByText("MIT License")).toBeVisible();
	});
});
