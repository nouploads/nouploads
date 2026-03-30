import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Convert Images — universal page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/convert");
	});

	test("should display tool heading and format selector", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert Images");
		await expect(page.getByText("Output format:")).toBeVisible();
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Which image formats can I convert between?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Convert");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/convert");
	});
});

test.describe("JPG to PNG — landing page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/jpg-to-png");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert JPG to PNG");
	});

	test("should have unique meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("JPG");
		expect(description).toContain("PNG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/jpg-to-png");
	});

	test("should display format-specific FAQ", async ({ page }) => {
		await expect(page.getByText("Why convert JPG to PNG?")).toBeVisible();
	});
});

test.describe("GIF to JPG — frame selector", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/gif-to-jpg");
	});

	test("should display tool heading and GIF-specific FAQ", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Convert GIF to JPG");
		await expect(
			page.getByText("What happens to animated GIFs?"),
		).toBeVisible();
	});

	test("should have correct meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("frame");
	});

	test("should show frame selector for animated GIF and produce JPG output", async ({
		page,
	}) => {
		// Wait for lazy component to hydrate
		await expect(page.getByText("Output format:")).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.gif"));

		// Wait for frame selector to appear (filmstrip with frame thumbnails)
		await expect(page.getByText("Select frame")).toBeVisible({
			timeout: 10000,
		});
		await expect(page.getByText(/Frame \d+ \/ \d+/)).toBeVisible();

		// Wait for download button (conversion complete)
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });
	});
});
