import { expect, test } from "@playwright/test";

test.describe("YAML ↔ JSON Converter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/yaml-json", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("JSON Converter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("YAML");
		expect(title).toContain("JSON");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/yaml-json");
	});

	test("should display YAML and JSON panels", async ({ page }) => {
		await expect(page.getByLabel("YAML input")).toBeVisible();
		await expect(page.getByLabel("JSON input")).toBeVisible();
	});

	test("should display direction toggle button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /switch conversion direction/i }),
		).toBeVisible();
	});

	test("should convert YAML to JSON", async ({ page }) => {
		const yamlInput = page.getByLabel("YAML input");
		await yamlInput.fill("name: test\nvalue: 42");

		const jsonOutput = page.getByLabel("JSON input");
		await expect(jsonOutput).toHaveValue(/"name": "test"/);
		await expect(jsonOutput).toHaveValue(/"value": 42/);
	});

	test("should show validation badges", async ({ page }) => {
		const yamlInput = page.getByLabel("YAML input");
		await yamlInput.fill("name: test");

		await expect(page.getByText("Valid").first()).toBeVisible();
	});

	test("should show error on invalid YAML", async ({ page }) => {
		const yamlInput = page.getByLabel("YAML input");
		await yamlInput.fill("key: [unclosed");

		await expect(
			page.locator(".text-red-800, .text-red-300").first(),
		).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText(/story behind YAML/i)).toBeVisible();
	});

	test("should display library attribution", async ({ page }) => {
		await expect(page.getByText("js-yaml")).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should have upload button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /upload file/i }),
		).toBeVisible();
	});

	test("should have indent control", async ({ page }) => {
		await expect(page.locator("#indent-select")).toBeVisible();
	});
});
