import { expect, test } from "@playwright/test";

test.describe("Compress JPG Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/compress-jpg");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Compress JPG");
	});

	test("should display file dropzone that accepts multiple files", async ({
		page,
	}) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
		const input = page.locator('input[type="file"]');
		await expect(input).toHaveAttribute("multiple", "");
	});

	test("should display quality slider", async ({ page }) => {
		await expect(page.getByText(/Quality:/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does JPG compression work?"),
		).toBeVisible();
		await expect(page.getByText("Is my data safe?")).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Compress JPG");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/compress-jpg");
	});
});

test.describe("Compress PNG Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/compress-png");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Compress PNG");
	});

	test("should display colors slider instead of quality", async ({ page }) => {
		await expect(page.getByText(/Colors:/i)).toBeVisible();
		await expect(page.getByText(/Quality:/i)).not.toBeVisible();
	});

	test("should display FAQ about color quantization", async ({ page }) => {
		await expect(
			page.getByText("What does the Colors slider do?"),
		).toBeVisible();
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/compress-png");
	});
});

test.describe("Compress WebP Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/compress-webp");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Compress WebP");
	});

	test("should display quality slider", async ({ page }) => {
		await expect(page.getByText(/Quality:/i)).toBeVisible();
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/compress-webp");
	});
});

test.describe("Compress GIF Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/compress-gif");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Compress GIF");
	});

	test("should display quality slider", async ({ page }) => {
		await expect(page.getByText(/Quality:/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText("How does GIF compression work?"),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("GIF");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/compress-gif");
	});
});

test.describe("Universal compress page", () => {
	test("should load /image/compress as a standalone page", async ({ page }) => {
		await page.goto("/image/compress");
		await expect(page).toHaveURL(/\/image\/compress$/);
		await expect(page.locator("h1")).toContainText("Compress Images");
	});
});
