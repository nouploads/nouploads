import { expect, test } from "@playwright/test";

test.describe("Hash Generator Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/hash-generator", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Hash Generator");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Hash Generator");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/hash-generator");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("hash");
	});

	test("should display Text and File tabs", async ({ page }) => {
		await expect(page.getByRole("tab", { name: "Text" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "File" })).toBeVisible();
	});

	test("should display text input area", async ({ page }) => {
		const textarea = page.locator("#hash-text");
		await expect(textarea).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(
			page.getByText(/What is a hash and why would I need one/),
		).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("Web Crypto API")).toBeVisible();
	});
});
