import { expect, test } from "@playwright/test";

test.describe("XML ↔ JSON Converter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/xml-json", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("JSON Converter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("XML");
		expect(title).toContain("JSON");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/xml-json");
	});

	test("should display XML and JSON panels", async ({ page }) => {
		await expect(page.getByLabel("XML input")).toBeVisible();
		await expect(page.getByLabel("JSON input")).toBeVisible();
	});

	test("should display direction toggle button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /switch conversion direction/i }),
		).toBeVisible();
	});

	test("should convert XML to JSON automatically", async ({ page }) => {
		const xmlInput = page.getByLabel("XML input");
		await xmlInput.fill("<root><name>Alice</name><age>30</age></root>");

		const jsonOutput = page.getByLabel("JSON input");
		await expect(jsonOutput).toHaveValue(/"name": "Alice"/);
		await expect(jsonOutput).toHaveValue(/"age": 30/);
	});

	test("should preserve attributes with @_ prefix", async ({ page }) => {
		const xmlInput = page.getByLabel("XML input");
		await xmlInput.fill('<user id="42" role="admin">Alice</user>');

		const jsonOutput = page.getByLabel("JSON input");
		await expect(jsonOutput).toHaveValue(/"@_id"/);
		await expect(jsonOutput).toHaveValue(/"@_role": "admin"/);
	});

	test("should convert JSON to XML after direction swap", async ({ page }) => {
		// Start in JSON → XML mode
		await page
			.getByRole("button", { name: /switch conversion direction/i })
			.click();

		const jsonInput = page.getByLabel("JSON input");
		await jsonInput.fill('{"root":{"name":"Alice","age":30}}');

		const xmlOutput = page.getByLabel("XML input");
		await expect(xmlOutput).toHaveValue(/<name>Alice<\/name>/);
		await expect(xmlOutput).toHaveValue(/<age>30<\/age>/);
	});

	test("should show Valid badge for well-formed XML", async ({ page }) => {
		const xmlInput = page.getByLabel("XML input");
		await xmlInput.fill("<root><child>value</child></root>");

		await expect(page.getByText("Valid").first()).toBeVisible();
	});

	test("should show an Invalid badge on malformed XML", async ({ page }) => {
		const xmlInput = page.getByLabel("XML input");
		await xmlInput.fill("<root><child>value</root>");

		// fast-xml-parser is lenient and still produces output, but the
		// XMLValidator flags the mismatched closing tag and the per-panel
		// Invalid badge appears.
		await expect(page.getByText("Invalid")).toBeVisible();
	});

	test("should clear both panels when Clear is clicked", async ({ page }) => {
		const xmlInput = page.getByLabel("XML input");
		await xmlInput.fill("<root><a>1</a></root>");

		await page.getByRole("button", { name: "Clear", exact: true }).click();

		await expect(xmlInput).toHaveValue("");
		await expect(page.getByLabel("JSON input")).toHaveValue("");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText(/standards body maintains XML/)).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should display library attribution", async ({ page }) => {
		await expect(
			page.getByRole("link", { name: "fast-xml-parser", exact: true }),
		).toBeVisible();
		await expect(page.getByText(/MIT/).first()).toBeVisible();
	});
});
