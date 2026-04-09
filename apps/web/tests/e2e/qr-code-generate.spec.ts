import { expect, test } from "@playwright/test";

test.describe("QR Code Generator - Generation Flow", () => {
	test("should generate a QR code when text is entered", async ({ page }) => {
		await page.goto("/developer/qr-code", { waitUntil: "networkidle" });

		const textarea = page.locator("#qr-text");
		await textarea.fill("https://example.com");

		// Wait for QR code image to appear
		const qrImage = page.locator('img[alt="QR Code"]');
		await expect(qrImage).toBeVisible({ timeout: 10000 });

		// Check download buttons are visible (labels include file size like "Download PNG (4 KB)")
		await expect(
			page.getByRole("button", { name: /Download PNG \(/ }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Download SVG \(/ }),
		).toBeVisible();
	});

	test("should show placeholder when input is empty", async ({ page }) => {
		await page.goto("/developer/qr-code", { waitUntil: "networkidle" });

		await expect(
			page.getByText("Enter text or URL above to generate a QR code"),
		).toBeVisible();
	});

	test("should update QR code when text changes", async ({ page }) => {
		await page.goto("/developer/qr-code", { waitUntil: "networkidle" });

		const textarea = page.locator("#qr-text");
		await textarea.fill("first text");

		const qrImage = page.locator('img[alt="QR Code"]');
		await expect(qrImage).toBeVisible({ timeout: 10000 });
		const firstSrc = await qrImage.getAttribute("src");

		await textarea.fill("different text");
		await expect(qrImage).toBeVisible({ timeout: 10000 });
		const secondSrc = await qrImage.getAttribute("src");

		expect(firstSrc).not.toBe(secondSrc);
	});
});
