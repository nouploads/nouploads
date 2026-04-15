import { expect, test } from "@playwright/test";

test.describe("JavaScript Formatter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/js-formatter", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("JavaScript Formatter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("JavaScript Formatter");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/js-formatter");
	});

	test("should have meta description mentioning minification", async ({
		page,
	}) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toContain("javascript");
		expect(description?.toLowerCase()).toMatch(/minified|brace|indent/);
	});

	test("should display input textarea", async ({ page }) => {
		await expect(page.getByLabel("JavaScript input")).toBeVisible();
	});

	test("should display toolbar buttons", async ({ page }) => {
		// Exact match so FAQ triggers (containing "format", "braces")
		// don't collide with toolbar button names.
		await expect(
			page.getByRole("button", { name: "Format", exact: true }),
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

	test("should display indent and brace style selectors", async ({ page }) => {
		await expect(
			page.getByRole("combobox", { name: "Indent size" }),
		).toBeVisible();
		await expect(
			page.getByRole("combobox", { name: "Brace style" }),
		).toBeVisible();
	});

	test("should show default indent and brace style labels on load", async ({
		page,
	}) => {
		// Regression: Radix Select reads its text from SelectItems inside a
		// Portal that only mounts on first open — so the trigger was blank
		// on initial load. We pass explicit children to SelectValue to fix it.
		const indentTrigger = page.getByRole("combobox", { name: "Indent size" });
		await expect(indentTrigger).toContainText("2 spaces");

		const braceTrigger = page.getByRole("combobox", { name: "Brace style" });
		await expect(braceTrigger).toContainText("Same line");
	});

	test("should beautify a minified function", async ({ page }) => {
		const textarea = page.getByLabel("JavaScript input");
		await textarea.fill("function greet(name){return 'hello '+name}");

		await page.getByRole("button", { name: "Format", exact: true }).click();

		// Format is async (dynamic import) — wait for the textarea value
		// to contain a newline and properly spaced return.
		await expect(textarea).toHaveValue(/function greet\(name\) \{/);
		const value = await textarea.inputValue();
		expect(value).toContain("\n");
		expect(value).toMatch(/return/);
	});

	test("should show an invalid badge for an unbalanced brace", async ({
		page,
	}) => {
		const textarea = page.getByLabel("JavaScript input");
		await textarea.fill("function f() { return 1;");

		await expect(page.getByText("Invalid JavaScript")).toBeVisible();
	});

	test("should show an invalid badge for an unterminated string", async ({
		page,
	}) => {
		const textarea = page.getByLabel("JavaScript input");
		await textarea.fill("const s = 'hello");

		await expect(page.getByText("Invalid JavaScript")).toBeVisible();
	});

	test("should clear the editor when Clear is clicked", async ({ page }) => {
		const textarea = page.getByLabel("JavaScript input");
		await textarea.fill("const x = 1;");

		await page.getByRole("button", { name: "Clear", exact: true }).click();

		await expect(textarea).toHaveValue("");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(
			page.getByText(/How long did it take to design JavaScript/),
		).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should display library attribution", async ({ page }) => {
		await expect(
			page.getByRole("link", { name: "js-beautify", exact: true }),
		).toBeVisible();
		await expect(page.getByText(/MIT/).first()).toBeVisible();
	});
});
