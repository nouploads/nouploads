import { expect, test } from "@playwright/test";

test.describe("JSON Formatter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/json-formatter", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("JSON Formatter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("JSON Formatter");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/json-formatter");
	});

	test("should display JSON input area", async ({ page }) => {
		const textarea = page.getByLabel("JSON input");
		await expect(textarea).toBeVisible();
	});

	test("should display toolbar buttons", async ({ page }) => {
		// Wait for lazy-loaded component to render
		await expect(page.getByLabel("JSON input")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Format", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Minify", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Copy", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Download", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Clear", exact: true }),
		).toBeVisible();
	});

	test("should validate and format JSON on input", async ({ page }) => {
		const textarea = page.getByLabel("JSON input");
		await textarea.fill('{"name":"test","value":42}');

		// Should show valid badge
		await expect(page.getByText("Valid JSON")).toBeVisible();

		// Should show stats
		await expect(page.getByText("Keys:")).toBeVisible();
		await expect(page.getByText("Depth:")).toBeVisible();
	});

	test("should show invalid badge for bad JSON", async ({ page }) => {
		const textarea = page.getByLabel("JSON input");
		await expect(textarea).toBeVisible();
		await textarea.fill("{invalid json}");

		await expect(page.getByText("Invalid JSON", { exact: true })).toBeVisible();
	});

	test("should format JSON when Format button is clicked", async ({ page }) => {
		const textarea = page.getByLabel("JSON input");
		await expect(textarea).toBeVisible();
		await textarea.fill('{"a":1,"b":2}');

		await expect(page.getByText("Valid JSON")).toBeVisible();
		await page.getByRole("button", { name: "Format", exact: true }).click();

		const value = await textarea.inputValue();
		expect(value).toContain("  ");
		expect(value).toContain('"a": 1');
	});

	test("should minify JSON when Minify button is clicked", async ({ page }) => {
		const textarea = page.getByLabel("JSON input");
		await expect(textarea).toBeVisible();
		await textarea.fill('{\n  "a": 1,\n  "b": 2\n}');

		await expect(page.getByText("Valid JSON")).toBeVisible();
		await page.getByRole("button", { name: "Minify", exact: true }).click();

		const value = await textarea.inputValue();
		expect(value).toBe('{"a":1,"b":2}');
	});

	test("should clear input when Clear button is clicked", async ({ page }) => {
		const textarea = page.getByLabel("JSON input");
		await textarea.fill('{"test": true}');
		await expect(page.getByText("Valid JSON")).toBeVisible();

		await page.getByRole("button", { name: "Clear" }).click();

		const value = await textarea.inputValue();
		expect(value).toBe("");
	});

	test("should display FAQ section", async ({ page }) => {
		const faqHeading = page.getByRole("heading", {
			name: "Frequently Asked Questions",
		});
		await faqHeading.scrollIntoViewIfNeeded();
		await expect(faqHeading).toBeVisible();
		await expect(page.getByText(/Who invented JSON/)).toBeVisible();
	});

	test("should display browser API attribution", async ({ page }) => {
		await expect(page.getByRole("link", { name: "JSON API" })).toBeVisible();
		await expect(
			page.locator("p.text-xs").getByText("no external libraries"),
		).toBeVisible();
	});

	test("should display upload button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /Upload .json/i }),
		).toBeVisible();
	});
});
