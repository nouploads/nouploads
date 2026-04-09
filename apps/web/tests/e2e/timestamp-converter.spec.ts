import { expect, test } from "@playwright/test";

test.describe("Timestamp Converter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/timestamp-converter", {
			waitUntil: "networkidle",
		});
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Timestamp Converter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Timestamp");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/timestamp-converter");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toContain("timestamp");
	});

	test("should display timestamp input and Now button", async ({ page }) => {
		await expect(page.getByLabel("Unix timestamp")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Now" }).first(),
		).toBeVisible();
	});

	test("should display timezone info", async ({ page }) => {
		await expect(page.getByText("Your timezone:")).toBeVisible();
	});

	test("should convert timestamp 0 to 1970 date", async ({ page }) => {
		const tsInput = page.locator("#ts-input");
		await expect(tsInput).toBeVisible();
		await tsInput.fill("0");

		// Should show the ISO 8601 result for epoch 0
		await expect(page.getByText("1970-01-01T00:00:00.000Z")).toBeVisible();
	});

	test("should display Date to Timestamp panel", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: "Date to Timestamp", exact: true }),
		).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("Date API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});
});
