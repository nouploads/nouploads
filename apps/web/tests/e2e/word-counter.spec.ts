import { expect, test } from "@playwright/test";

test.describe("Word Counter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/word-counter", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Word Counter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("Word Counter");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/word-counter");
	});

	test("should display text input area", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await expect(textarea).toBeVisible();
	});

	test("should display toolbar buttons", async ({ page }) => {
		await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Upload .txt/i }),
		).toBeVisible();
	});

	test("should update stats when text is typed", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await textarea.fill("Hello world. How are you?");

		await expect(page.getByText("Characters:")).toBeVisible();
		await expect(page.getByText("Words:")).toBeVisible();
		await expect(page.getByText("Sentences:")).toBeVisible();
		await expect(page.getByText("Paragraphs:")).toBeVisible();
		await expect(page.getByText("Reading Time:")).toBeVisible();
	});

	test("should show correct word count", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await textarea.fill("one two three four five");

		// Word count should be 5
		const wordsSpan = page.locator("span", { hasText: "Words:" });
		await expect(wordsSpan.locator("span.font-medium")).toHaveText("5");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText(/238 words-per-minute/)).toBeVisible();
	});

	test("should display browser API attribution", async ({ page }) => {
		await expect(page.getByText("String API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});

	test("should clear text when Clear button is clicked", async ({ page }) => {
		const textarea = page.getByLabel("Text input");
		await textarea.fill("Some text here");

		await page.getByRole("button", { name: "Clear" }).click();

		const value = await textarea.inputValue();
		expect(value).toBe("");
	});
});
