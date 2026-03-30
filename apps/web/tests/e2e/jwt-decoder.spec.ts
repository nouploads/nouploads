import { expect, test } from "@playwright/test";

test.describe("JWT Decoder Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/jwt-decoder", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("JWT Decoder");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("JWT Decoder");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/jwt-decoder");
	});

	test("should display JWT input textarea", async ({ page }) => {
		const textarea = page.locator("#jwt-input");
		await expect(textarea).toBeVisible();
	});

	test("should decode a valid JWT on paste", async ({ page }) => {
		const token =
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

		await page.locator("#jwt-input").fill(token);

		// Header section should show HS256
		await expect(page.getByText('"alg": "HS256"')).toBeVisible();
		// Payload section should show John Doe
		await expect(page.getByText('"name": "John Doe"')).toBeVisible();
		// Signature section should be visible
		await expect(page.getByText("Signature")).toBeVisible();
		// No expiry badge since this token has no exp claim
		await expect(page.getByText("No Expiry")).toBeVisible();
	});

	test("should show error for invalid JWT", async ({ page }) => {
		await page.locator("#jwt-input").fill("not-a-jwt");

		await expect(page.getByText(/Invalid JWT: expected 3 parts/)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText(/What is a JWT token/)).toBeVisible();
	});

	test("should display browser API attribution", async ({ page }) => {
		await expect(page.getByText("Base64 decoding API")).toBeVisible();
	});
});
