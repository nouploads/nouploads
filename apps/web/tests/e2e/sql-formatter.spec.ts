import { expect, test } from "@playwright/test";

test.describe("SQL Formatter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/sql-formatter", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("SQL Formatter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("SQL Formatter");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/sql-formatter");
	});

	test("should have meta description mentioning dialects", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toContain("sql");
		expect(description?.toLowerCase()).toMatch(/postgresql|mysql|dialect/);
	});

	test("should display input textarea", async ({ page }) => {
		await expect(page.getByLabel("SQL input")).toBeVisible();
	});

	test("should display toolbar buttons", async ({ page }) => {
		// Exact match so FAQ accordion triggers (which contain "formatting" /
		// "minifying") don't collide with the toolbar button names.
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

	test("should display dialect and keyword case selectors", async ({
		page,
	}) => {
		await expect(
			page.getByRole("combobox", { name: "SQL dialect" }),
		).toBeVisible();
		await expect(
			page.getByRole("combobox", { name: "Keyword case" }),
		).toBeVisible();
	});

	test("should show default dialect and keyword case labels on load", async ({
		page,
	}) => {
		// Regression: Radix Select reads SelectValue text from the selected
		// SelectItem's ItemText, but those live in a Portal that only mounts
		// on first open — so the trigger was showing empty on load. We pass
		// explicit children to SelectValue to fix this.
		const dialectTrigger = page.getByRole("combobox", { name: "SQL dialect" });
		await expect(dialectTrigger).toContainText("Standard SQL");

		const keywordCaseTrigger = page.getByRole("combobox", {
			name: "Keyword case",
		});
		await expect(keywordCaseTrigger).toContainText("UPPERCASE");
	});

	test("should format a SQL query and rewrite the textarea", async ({
		page,
	}) => {
		const textarea = page.getByLabel("SQL input");
		await textarea.fill("select id, name from users where id = 1");

		await page.getByRole("button", { name: "Format", exact: true }).click();

		// Formatting is async (dynamic import) — wait for the textarea value
		// to contain uppercased keywords and a newline.
		await expect(textarea).toHaveValue(/SELECT[\s\S]*FROM/);
		const value = await textarea.inputValue();
		expect(value).toContain("\n");
	});

	test("should minify a multi-line query into a single line", async ({
		page,
	}) => {
		const textarea = page.getByLabel("SQL input");
		await textarea.fill("SELECT\n  id,\n  name\nFROM users");

		await page.getByRole("button", { name: "Minify", exact: true }).click();

		const value = await textarea.inputValue();
		expect(value).not.toContain("\n");
		expect(value).toContain("SELECT");
		expect(value).toContain("FROM users");
	});

	test("should show an invalid badge for unbalanced parentheses", async ({
		page,
	}) => {
		const textarea = page.getByLabel("SQL input");
		await textarea.fill("SELECT (id, name FROM users");

		await expect(page.getByText("Invalid SQL")).toBeVisible();
	});

	test("should clear the editor when Clear is clicked", async ({ page }) => {
		const textarea = page.getByLabel("SQL input");
		await textarea.fill("SELECT * FROM users");

		await page.getByRole("button", { name: "Clear", exact: true }).click();

		await expect(textarea).toHaveValue("");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText(/Who standardized SQL/)).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should display library attribution", async ({ page }) => {
		// Target the attribution link specifically — the text "sql-formatter"
		// also appears in the About paragraph.
		await expect(
			page.getByRole("link", { name: "sql-formatter", exact: true }),
		).toBeVisible();
		await expect(page.getByText(/MIT/).first()).toBeVisible();
	});
});
