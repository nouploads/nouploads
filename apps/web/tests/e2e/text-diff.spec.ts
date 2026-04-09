import { expect, test } from "@playwright/test";

test.describe("Text Diff Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/text-diff", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Text Diff");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Text Diff");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/text-diff");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toMatch(/diff|compare/);
	});

	test("should display Original and Modified text areas", async ({ page }) => {
		await expect(page.locator("#diff-left")).toBeVisible();
		await expect(page.locator("#diff-right")).toBeVisible();
	});

	test("should display view mode buttons", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: "Unified", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Side by Side", exact: true }),
		).toBeVisible();
	});

	test("should show diff results when text is entered", async ({ page }) => {
		await page.locator("#diff-left").fill("line one\nline two\nline three");
		await page
			.locator("#diff-right")
			.fill("line one\nline changed\nline three");

		// Wait for debounced diff to show results with added/removed badges
		await expect(page.getByText(/added/)).toBeVisible({ timeout: 5000 });
		await expect(page.getByText(/removed/)).toBeVisible({ timeout: 5000 });
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("JavaScript Array API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});
});
