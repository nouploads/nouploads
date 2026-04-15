import { expect, test } from "@playwright/test";

test.describe("HTML Formatter Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/html-formatter", { waitUntil: "networkidle" });
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("HTML Formatter");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("HTML Formatter");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/html-formatter");
	});

	test("should have meta description mentioning indent and wrap", async ({
		page,
	}) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toContain("html");
		expect(description?.toLowerCase()).toMatch(/indent|wrap/);
	});

	test("should display input textarea", async ({ page }) => {
		await expect(page.getByLabel("HTML input")).toBeVisible();
	});

	test("should display toolbar buttons", async ({ page }) => {
		// Exact match so FAQ accordion triggers don't collide with toolbar
		// button names (formatter/Formatting etc).
		await expect(
			page.getByRole("button", { name: "Format", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Copy", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Download", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Clear", exact: true }),
		).toBeVisible();
	});

	test("should display indent and line-wrap selectors", async ({ page }) => {
		await expect(
			page.getByRole("combobox", { name: "Indent size" }),
		).toBeVisible();
		await expect(
			page.getByRole("combobox", { name: "Line wrap" }),
		).toBeVisible();
	});

	test("should show default indent and wrap labels on load", async ({
		page,
	}) => {
		// Regression: Radix Select reads its text from SelectItems inside a
		// Portal that only mounts on first open — so the trigger was blank
		// on initial load. We pass explicit children to SelectValue to fix it.
		const indentTrigger = page.getByRole("combobox", { name: "Indent size" });
		await expect(indentTrigger).toContainText("2 spaces");

		const wrapTrigger = page.getByRole("combobox", { name: "Line wrap" });
		await expect(wrapTrigger).toContainText("80 chars");
	});

	test("should beautify a collapsed HTML document", async ({ page }) => {
		const textarea = page.getByLabel("HTML input");
		await textarea.fill(
			"<html><head><title>T</title></head><body><div><p>Hi</p></div></body></html>",
		);

		await page.getByRole("button", { name: "Format", exact: true }).click();

		// Format is async (dynamic import) — wait for the textarea to contain
		// newlines and indented content.
		await expect(textarea).toHaveValue(/\n\s+<(head|body|div)/);
	});

	test("should show an invalid badge for an unterminated tag", async ({
		page,
	}) => {
		const textarea = page.getByLabel("HTML input");
		await textarea.fill("<div><p>Hi</p><span");

		await expect(page.getByText("Invalid HTML")).toBeVisible();
	});

	test("should clear the editor when Clear is clicked", async ({ page }) => {
		const textarea = page.getByLabel("HTML input");
		await textarea.fill("<div>Hi</div>");

		await page.getByRole("button", { name: "Clear", exact: true }).click();

		await expect(textarea).toHaveValue("");
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText(/Who invented HTML/)).toBeVisible();
	});

	test("should display About section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should display library attribution", async ({ page }) => {
		await expect(
			page.getByRole("link", { name: "js-beautify", exact: true }),
		).toBeVisible();
		await expect(page.getByText(/MIT/).first()).toBeVisible();
	});
});
