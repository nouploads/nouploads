import { expect, test } from "@playwright/test";

test.describe("JSON ↔ CSV Converter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/json-csv", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("JSON");
		await expect(page.locator("h1")).toContainText("CSV");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("JSON");
		expect(title).toContain("CSV");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/json-csv");
	});

	test("should display direction tabs", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /JSON → CSV/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /CSV → JSON/i }),
		).toBeVisible();
	});

	test("should display input textarea", async ({ page }) => {
		await expect(page.getByLabel(/JSON input/i)).toBeVisible();
	});

	test("should display convert and action buttons", async ({ page }) => {
		await expect(page.getByRole("button", { name: "Convert" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
		await expect(page.getByRole("button", { name: /Download/i })).toBeVisible();
		await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
	});

	test("should display delimiter selector", async ({ page }) => {
		await expect(page.getByLabel("Delimiter")).toBeVisible();
	});

	test("should display flatten checkbox in JSON→CSV mode", async ({ page }) => {
		await expect(page.getByText("Flatten nested")).toBeVisible();
	});

	test("should convert JSON to CSV", async ({ page }) => {
		const textarea = page.getByLabel(/JSON input/i);
		await textarea.fill('[{"name":"Alice","age":30},{"name":"Bob","age":25}]');

		await page.getByRole("button", { name: "Convert" }).click();

		const output = page.getByRole("textbox", { name: /CSV output/i });
		await expect(output).toBeVisible();
		const value = await output.inputValue();
		expect(value).toContain("name");
		expect(value).toContain("age");
		expect(value).toContain("Alice");
		expect(value).toContain("Bob");
	});

	test("should switch to CSV→JSON mode and convert", async ({ page }) => {
		await page.getByRole("button", { name: /CSV → JSON/i }).click();

		const textarea = page.getByLabel(/CSV input/i);
		await textarea.fill("name,age\nAlice,30\nBob,25");

		await page.getByRole("button", { name: "Convert" }).click();

		const output = page.getByRole("textbox", { name: /JSON output/i });
		await expect(output).toBeVisible();
		const value = await output.inputValue();
		const parsed = JSON.parse(value);
		expect(parsed).toHaveLength(2);
		expect(parsed[0].name).toBe("Alice");
	});

	test("should show error for invalid JSON", async ({ page }) => {
		const textarea = page.getByLabel(/JSON input/i);
		await textarea.fill("{not valid json}");

		await page.getByRole("button", { name: "Convert" }).click();

		await expect(
			page.getByText(/Expected|Invalid|must be|error|failed/i),
		).toBeVisible();
	});

	test("should display row and column stats after conversion", async ({
		page,
	}) => {
		const textarea = page.getByLabel(/JSON input/i);
		await textarea.fill('[{"name":"Alice","age":30},{"name":"Bob","age":25}]');
		await page.getByRole("button", { name: "Convert" }).click();

		await expect(page.getByText("Rows:")).toBeVisible();
		await expect(page.getByText("Columns:")).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText(/CSV format first used/i)).toBeVisible();
	});

	test("should display browser API attribution", async ({ page }) => {
		await expect(page.getByText("JSON API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});

	test("should display About this tool section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should display upload button", async ({ page }) => {
		await expect(page.getByRole("button", { name: /Upload/i })).toBeVisible();
	});
});
