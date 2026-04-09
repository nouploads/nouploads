import { expect, test } from "@playwright/test";

test.describe("Case Converter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/case-converter", {
			waitUntil: "networkidle",
		});
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Case Converter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Case Converter");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/case-converter");
	});

	test("should display input textarea", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await expect(textarea).toBeVisible();
	});

	test("should display Clear button", async ({ page }) => {
		await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
	});

	test("should show all conversion results on input", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await textarea.fill("hello world example");

		// Should show the results table
		await expect(page.getByText("All conversions")).toBeVisible();

		// Should show case style labels in the table
		await expect(
			page.getByRole("cell", { name: "UPPERCASE", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "camelCase", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "snake_case", exact: true }),
		).toBeVisible();

		// Should show correct output values in table cells
		await expect(
			page.getByRole("cell", { name: "HELLO WORLD EXAMPLE", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "helloWorldExample", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "hello_world_example", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "hello-world-example", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "HelloWorldExample", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "HELLO_WORLD_EXAMPLE", exact: true }),
		).toBeVisible();
	});

	test("should clear input when Clear button is clicked", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await textarea.fill("hello world");
		await expect(page.getByText("All conversions")).toBeVisible();

		await page.getByRole("button", { name: "Clear" }).click();

		const value = await textarea.inputValue();
		expect(value).toBe("");
	});

	test("should handle camelCase input correctly", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await textarea.fill("helloWorldExample");

		// Should split camelCase and show snake_case and kebab-case
		await expect(
			page.getByRole("cell", { name: "hello_world_example", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "hello-world-example", exact: true }),
		).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(
			page.getByText(/Where does the name camelCase come from/),
		).toBeVisible();
	});

	test("should display browser API attribution", async ({ page }) => {
		await expect(page.getByText("String API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});

	test("should have copy buttons for each result", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await textarea.fill("test input");

		// Each row should have a Copy button
		const copyButtons = page.getByRole("button", { name: /Copy .* result/i });
		await expect(copyButtons.first()).toBeVisible();
	});
});
