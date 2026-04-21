import { expect, test } from "@playwright/test";

test.describe("PDF Merge Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/pdf/merge");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Merge PDFs");
	});

	test("should display file dropzone that accepts multiple files", async ({
		page,
	}) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible({
			timeout: 10000,
		});
		const input = page.locator('input[type="file"]').first();
		await expect(input).toHaveAttribute("multiple", "");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("Where did the PDF format come from?"),
		).toBeVisible();
		await expect(
			page.getByText("Can I reorder pages before merging?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("PDF");
		// Accept either stem — the copy can say "merge" or "merging".
		expect(description?.toLowerCase()).toMatch(/merg(e|ing)/);
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/pdf/merge");
	});
});
