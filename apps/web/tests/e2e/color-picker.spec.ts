import { expect, test } from "@playwright/test";

test.describe("Color Picker Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/color-picker", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Color Picker");
		await expect(
			page.getByText(/free, open source, privacy-first/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Color Picker");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/color-picker");
	});

	test("should display color input with hex value", async ({ page }) => {
		const input = page.locator('input[aria-label="Color value"]');
		await expect(input).toBeVisible();
		const value = await input.inputValue();
		expect(value).toMatch(/^#[0-9a-f]{6}$/);
	});

	test("should display large color swatch with hex overlay", async ({
		page,
	}) => {
		// The large swatch shows the hex value
		await expect(page.locator("span.font-mono.font-bold")).toBeVisible();
	});

	test("should update swatch when typing a valid color", async ({ page }) => {
		const input = page.locator('input[aria-label="Color value"]');
		await input.fill("#ff0000");
		// RGB row should show red values
		await expect(page.getByText("255, 0, 0")).toBeVisible();
	});

	test("should display all format cells", async ({ page }) => {
		const labels = [
			"HEX",
			"RGB",
			"HSL",
			"HSV",
			"HWB",
			"CMYK",
			"LAB",
			"LCH",
			"XYZ",
			"LUV",
			"OKLCH",
		];
		for (const label of labels) {
			await expect(
				page.locator(".grid").getByText(label, { exact: true }),
			).toBeVisible();
		}
	});

	test("should show contrast checker", async ({ page }) => {
		await expect(page.getByText(/WCAG (AA|AAA|Fail)/)).toBeVisible();
	});

	test("should have random color button", async ({ page }) => {
		const input = page.locator('input[aria-label="Color value"]');
		const before = await input.inputValue();
		await page.getByRole("button", { name: /random/i }).click();
		const after = await input.inputValue();
		expect(after).not.toBe(before);
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(
			page.getByText(/What color formats does this picker support/),
		).toBeVisible();
	});

	test("should display library attribution", async ({ page }) => {
		await expect(page.getByText("react-colorful")).toBeVisible();
		await expect(page.getByText("culori")).toBeVisible();
	});
});

test.describe("Developer Category Page", () => {
	test("should display category heading", async ({ page }) => {
		await page.goto("/developer", { waitUntil: "networkidle" });
		await expect(page.locator("h1")).toContainText("Developer Tools");
	});

	test("should list Color Picker tool", async ({ page }) => {
		await page.goto("/developer", { waitUntil: "networkidle" });
		await expect(page.getByText("Color Picker")).toBeVisible();
	});
});
