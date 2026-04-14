import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF Reorder Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/reorder");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Reorder PDF Pages");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(/original purpose of the PDF format/i),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("rearrange");
		expect(description).toContain("PDF");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/reorder");
	});

	test("should surface an error when a non-PDF file is uploaded", async ({
		page,
	}) => {
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
		// JPG is not a PDF — pdf-lib.load() should reject it
		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// An error message should appear — exact copy varies by browser/pdf-lib
		// version, but the destructive styling is consistent.
		await expect(page.locator(".text-destructive").first()).toBeVisible({
			timeout: 15000,
		});
	});
});
