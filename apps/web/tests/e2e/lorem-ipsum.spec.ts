import { expect, test } from "@playwright/test";

test.describe("Lorem Ipsum Generator Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/lorem-ipsum", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Lorem Ipsum");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Lorem Ipsum");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/lorem-ipsum");
	});

	test("should display generated text on load", async ({ page }) => {
		const textarea = page.getByLabel("Generated lorem ipsum text");
		await expect(textarea).toBeVisible();
		const value = await textarea.inputValue();
		expect(value.length).toBeGreaterThan(0);
		expect(value).toContain("Lorem ipsum dolor sit amet");
	});

	test("should display mode toggle buttons", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: "paragraphs", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "sentences", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "words", exact: true }),
		).toBeVisible();
	});

	test("should display copy and download buttons", async ({ page }) => {
		await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
		await expect(page.getByRole("button", { name: /Download/i })).toBeVisible();
	});

	test("should display word and character counts", async ({ page }) => {
		await expect(
			page.getByText(/[\d,]+ words · [\d,]+ characters/),
		).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(
			page.getByText(/Where does lorem ipsum come from/),
		).toBeVisible();
	});

	test("should display browser API attribution", async ({ page }) => {
		await expect(page.getByText("Math API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});

	test("should switch to word mode and generate exact word count", async ({
		page,
	}) => {
		await page.getByRole("button", { name: "words", exact: true }).click();

		// Set count to 25
		const countInput = page.getByLabel("Count:");
		await countInput.fill("25");

		// Wait for re-generation
		const textarea = page.getByLabel("Generated lorem ipsum text");
		await page.waitForTimeout(200);
		const value = await textarea.inputValue();
		const wordCount = value
			.trim()
			.split(/\s+/)
			.filter((w: string) => w.length > 0).length;
		expect(wordCount).toBe(25);
	});
});
