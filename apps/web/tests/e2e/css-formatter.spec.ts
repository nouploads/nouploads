import { expect, test } from "@playwright/test";

test.describe("CSS Formatter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/css-formatter", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("CSS Formatter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("CSS Minifier");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/css-formatter");
	});

	test("should display CSS input and output areas", async ({ page }) => {
		const input = page.getByLabel("CSS input");
		await expect(input).toBeVisible();
		const output = page.getByLabel("CSS output");
		await expect(output).toBeVisible();
	});

	test("should display toolbar buttons", async ({ page }) => {
		await expect(page.getByRole("button", { name: "Beautify" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Minify" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
	});

	test("should minify CSS when input is provided and Minify is selected", async ({
		page,
	}) => {
		const input = page.getByLabel("CSS input");
		await page.getByRole("button", { name: "Minify" }).click();
		await input.fill("body {\n  color: red;\n  /* comment */\n  margin: 0;\n}");

		const output = page.getByLabel("CSS output");
		await expect(output).not.toHaveValue("");
		const outputValue = await output.inputValue();
		expect(outputValue).not.toContain("/*");
		expect(outputValue).not.toContain("\n");
	});

	test("should beautify CSS when input is provided", async ({ page }) => {
		const input = page.getByLabel("CSS input");
		await input.fill("body{color:red;margin:0}");

		const output = page.getByLabel("CSS output");
		await expect(output).not.toHaveValue("");
		const outputValue = await output.inputValue();
		expect(outputValue).toContain("\n");
	});

	test("should show size savings", async ({ page }) => {
		const input = page.getByLabel("CSS input");
		await page.getByRole("button", { name: "Minify" }).click();
		await input.fill("body {\n  color: red;\n  margin: 0;\n}");

		await expect(page.getByText("Original:")).toBeVisible();
		await expect(page.getByText("Output:")).toBeVisible();
	});

	test("should clear input when Clear button is clicked", async ({ page }) => {
		const input = page.getByLabel("CSS input");
		await input.fill("body { color: red; }");

		await page.getByRole("button", { name: "Clear" }).click();

		const value = await input.inputValue();
		expect(value).toBe("");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(
			page.getByText(/origin of Cascading Style Sheets/),
		).toBeVisible();
	});

	test("should display browser API attribution", async ({ page }) => {
		await expect(page.getByText("String API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});

	test("should display upload button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /Upload .css/i }),
		).toBeVisible();
	});
});
