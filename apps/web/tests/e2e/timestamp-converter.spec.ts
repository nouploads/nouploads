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
		await page.getByLabel("Unix timestamp").fill("0");

		// Should show January 1, 1970 somewhere in the results
		await expect(page.getByText("1970")).toBeVisible();
	});

	test("should display Date to Timestamp panel", async ({ page }) => {
		await expect(page.getByText("Date to Timestamp")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("Date API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});
});
