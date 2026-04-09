import { expect, test } from "@playwright/test";

test.describe("UUID Generator Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/uuid-generator", {
			waitUntil: "networkidle",
		});
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("UUID Generator");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("UUID");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/uuid-generator");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toContain("uuid");
	});

	test("should display Generate and Validate tabs", async ({ page }) => {
		await expect(page.getByRole("tab", { name: /Generate/i })).toBeVisible();
		await expect(page.getByRole("tab", { name: /Validate/i })).toBeVisible();
	});

	test("should display Generate button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: "Generate", exact: true }),
		).toBeVisible();
	});

	test("should generate a UUID when Generate is clicked", async ({ page }) => {
		// A UUID is pre-generated on mount; click Generate to get a new one
		await page.getByRole("button", { name: "Generate", exact: true }).click();

		// UUID format: 8-4-4-4-12 hex chars = 36 chars total
		const uuidLocator = page.locator(".select-all").first();
		await expect(uuidLocator).toBeVisible();
		const text = await uuidLocator.textContent();
		expect(text).toBeTruthy();
		expect(text?.length).toBe(36);
		expect(text).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
	});

	test("should display FAQ section", async ({ page }) => {
		const faqHeading = page.getByRole("heading", {
			name: "Frequently Asked Questions",
		});
		await faqHeading.scrollIntoViewIfNeeded();
		await expect(faqHeading).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(
			page.getByRole("link", { name: "Web Crypto API" }),
		).toBeVisible();
		await expect(
			page.locator("p.text-xs").getByText("no external libraries"),
		).toBeVisible();
	});
});
