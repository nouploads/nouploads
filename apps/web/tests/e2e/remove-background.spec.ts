import { expect, test } from "@playwright/test";

test.describe("Remove Background Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/remove-background");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Remove Background");
	});

	test("should display file dropzone for single file", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
		const input = page.locator('input[type="file"]');
		await expect(input).not.toHaveAttribute("multiple", "");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"How did AI learn to separate foregrounds from backgrounds?",
			),
		).toBeVisible();
		await expect(
			page.getByText("How long does processing take?"),
		).toBeVisible();
	});

	test("should display about section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
		await expect(page.getByText(/ONNX neural network/)).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Remove backgrounds");
		expect(description).toContain("AI");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/remove-background");
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("@imgly/background-removal")).toBeVisible();
	});
});
