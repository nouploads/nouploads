import { expect, test } from "@playwright/test";

test.describe("URL Encoder Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/url-encoder", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("URL Encoder");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("URL");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/url-encoder");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toMatch(/url|encode/);
	});

	test("should display input and output areas", async ({ page }) => {
		await expect(page.getByLabel("URL input")).toBeVisible();
		await expect(page.getByLabel("URL output")).toBeVisible();
	});

	test("should display encode and decode mode buttons", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: "Encode", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Decode", exact: true }),
		).toBeVisible();
	});

	test("should encode text with spaces", async ({ page }) => {
		await page.getByLabel("URL input").fill("hello world");

		const output = await page.getByLabel("URL output").inputValue();
		expect(output).toContain("hello%20world");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("encodeURIComponent API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});
});
