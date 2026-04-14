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

	test("should allow clearing the count field and typing a new value", async ({
		page,
	}) => {
		// Regression: users couldn't backspace the existing digit and type a new
		// one because handleCountChange early-returned on NaN, snapping the
		// controlled input back to the previous value.
		await page.getByRole("button", { name: "words", exact: true }).click();
		const countInput = page.getByLabel("Count:");

		// Start by setting count to 1 so the field has a single digit to clear
		await countInput.fill("1");
		await expect(countInput).toHaveValue("1");

		// Select-all + delete to empty the field, then type a new value
		await countInput.press("ControlOrMeta+a");
		await countInput.press("Delete");
		// Field should actually go empty (before the fix it would snap back to "1")
		await expect(countInput).toHaveValue("");

		await countInput.pressSequentially("6");
		await expect(countInput).toHaveValue("6");

		// Output should reflect the new count
		const textarea = page.getByLabel("Generated lorem ipsum text");
		await page.waitForTimeout(200);
		const value = await textarea.inputValue();
		const wordCount = value
			.trim()
			.split(/\s+/)
			.filter((w: string) => w.length > 0).length;
		expect(wordCount).toBe(6);
	});

	test("should show an error when the count exceeds the maximum", async ({
		page,
	}) => {
		// Regression: typing 800 used to silently reset to 100 on blur with no
		// explanation. Now the field should show an inline error so the user
		// understands why the value gets clamped.
		const countInput = page.getByLabel("Count:");
		await countInput.fill("800");

		// Inline error appears immediately during typing
		await expect(page.getByRole("alert")).toHaveText(/Max is 100/i);
		// The input is marked invalid for assistive tech
		await expect(countInput).toHaveAttribute("aria-invalid", "true");

		// Blur snaps the field back to the clamped max and clears the error
		await page.getByRole("button", { name: "words", exact: true }).click();
		await expect(countInput).toHaveValue("100");
		await expect(page.getByRole("alert")).toHaveCount(0);
	});

	test("should show an error when the count is below the minimum", async ({
		page,
	}) => {
		const countInput = page.getByLabel("Count:");
		await countInput.fill("0");

		await expect(page.getByRole("alert")).toHaveText(/Min is 1/i);
		await expect(countInput).toHaveAttribute("aria-invalid", "true");

		// Blur snaps to the clamped minimum
		await page.getByRole("button", { name: "words", exact: true }).click();
		await expect(countInput).toHaveValue("1");
		await expect(page.getByRole("alert")).toHaveCount(0);
	});

	test("should clear the error when the count returns to a valid value", async ({
		page,
	}) => {
		const countInput = page.getByLabel("Count:");
		await countInput.fill("800");
		await expect(page.getByRole("alert")).toBeVisible();

		// Correct the value without leaving the field
		await countInput.fill("42");
		await expect(page.getByRole("alert")).toHaveCount(0);
		await expect(countInput).toHaveAttribute("aria-invalid", "false");
	});

	test("should restore count on blur when field is left empty", async ({
		page,
	}) => {
		const countInput = page.getByLabel("Count:");
		await countInput.fill("7");
		await expect(countInput).toHaveValue("7");

		// Clear the field, then blur without typing anything
		await countInput.press("ControlOrMeta+a");
		await countInput.press("Delete");
		await expect(countInput).toHaveValue("");

		// Blur by focusing another element
		await page.getByRole("button", { name: "words", exact: true }).click();

		// Input should snap back to the previous valid count
		await expect(countInput).toHaveValue("7");
	});
});
