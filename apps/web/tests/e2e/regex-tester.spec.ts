import { expect, test } from "@playwright/test";

test.describe("Regex Tester Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/regex-tester", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Regex Tester");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Regex");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/regex-tester");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toMatch(/regex|regular expression/);
	});

	test("should display regex input and test string textarea", async ({
		page,
	}) => {
		await expect(page.getByLabel("Regex pattern")).toBeVisible();
		await expect(page.getByLabel("Test string")).toBeVisible();
	});

	test("should display flag toggles", async ({ page }) => {
		await expect(page.getByLabel(/global flag/i)).toBeVisible();
		await expect(page.getByLabel(/insensitive flag/i)).toBeVisible();
		await expect(page.getByLabel(/multiline flag/i)).toBeVisible();
		await expect(page.getByLabel(/dotAll flag/i)).toBeVisible();
		await expect(page.getByLabel(/unicode flag/i)).toBeVisible();
	});

	test("should show matches when pattern and test string are entered", async ({
		page,
	}) => {
		await page.getByLabel("Regex pattern").fill("\\d+");
		await page.getByLabel("Test string").fill("abc 123 def 456");

		// Wait for debounced evaluation
		await expect(page.getByText(/2 matches/)).toBeVisible();
	});

	test("should show error for invalid regex", async ({ page }) => {
		await page.getByLabel("Regex pattern").fill("[invalid");
		await page.getByLabel("Test string").fill("test");

		// Wait for debounced evaluation and error display
		await expect(
			page.locator(".text-destructive").filter({ hasText: /.+/ }),
		).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("RegExp API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});
});
