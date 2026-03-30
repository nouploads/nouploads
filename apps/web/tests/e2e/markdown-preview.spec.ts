import { expect, test } from "@playwright/test";

test.describe("Markdown Preview Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/markdown-preview", {
			waitUntil: "networkidle",
		});
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Markdown Preview");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Markdown");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/markdown-preview");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toContain("markdown");
	});

	test("should display editor and preview areas", async ({ page }) => {
		await expect(page.getByLabel("Markdown input")).toBeVisible();
		await expect(page.getByText("Preview").first()).toBeVisible();
	});

	test("should display toolbar buttons", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /Insert Bold/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Insert Italic/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Insert Heading/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Insert Code/i }),
		).toBeVisible();
	});

	test("should render markdown heading in preview", async ({ page }) => {
		await page.getByLabel("Markdown input").fill("# Hello");

		// Wait for debounced rendering
		const preview = page.locator(".prose");
		await expect(preview.locator("h1")).toContainText("Hello");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
	});

	test("should display attribution mentioning marked", async ({ page }) => {
		await expect(page.getByText("marked")).toBeVisible();
		await expect(page.getByText("MIT License")).toBeVisible();
	});
});
