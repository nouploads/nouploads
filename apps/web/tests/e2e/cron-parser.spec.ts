import { expect, test } from "@playwright/test";

test.describe("CRON Expression Parser Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/developer/cron-parser", {
			waitUntil: "networkidle",
		});
	});

	test("should display page heading and description", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("CRON Expression Parser");
		await expect(
			page.getByText(/free, private, no upload required/i),
		).toBeVisible();
	});

	test("should have correct meta title", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("CRON");
		expect(title).toContain("NoUploads");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/developer/cron-parser");
	});

	test("should have meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description?.toLowerCase()).toContain("cron");
	});

	test("should display cron input field", async ({ page }) => {
		await expect(
			page.getByRole("textbox", { name: "Cron expression" }),
		).toBeVisible();
	});

	test("should display preset buttons", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: "Every minute" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Every hour" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Daily at midnight" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Weekdays at 9am" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "First of month" }),
		).toBeVisible();
	});

	test("should parse expression and show description", async ({ page }) => {
		await page
			.getByRole("textbox", { name: "Cron expression" })
			.fill("*/15 * * * *");
		await expect(page.getByText(/15 minutes/i)).toBeVisible();
	});

	test("should show next runs table", async ({ page }) => {
		await page
			.getByRole("textbox", { name: "Cron expression" })
			.fill("*/15 * * * *");
		await expect(page.getByText("Next 10 Runs")).toBeVisible();
		// Table should have rows
		await expect(page.locator("table tbody tr").first()).toBeVisible();
	});

	test("should show error for invalid expression", async ({ page }) => {
		await page
			.getByRole("textbox", { name: "Cron expression" })
			.fill("invalid");
		await expect(page.getByText(/Expected 5 fields/)).toBeVisible();
	});

	test("should load preset on click", async ({ page }) => {
		await page.getByRole("button", { name: "Weekdays at 9am" }).click();
		const input = page.getByRole("textbox", { name: "Cron expression" });
		await expect(input).toHaveValue("0 9 * * 1-5");
		// Check description contains weekday reference
		await expect(
			page.locator("p.font-semibold", { hasText: /weekday/i }),
		).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
	});

	test("should display About this tool section", async ({ page }) => {
		await expect(page.getByText("About this tool")).toBeVisible();
	});

	test("should display attribution", async ({ page }) => {
		await expect(page.getByText("Date API")).toBeVisible();
		await expect(page.getByText("no external libraries")).toBeVisible();
	});

	test("should have cheat sheet toggle", async ({ page }) => {
		const toggle = page.getByRole("button", {
			name: "Cron Syntax Cheat Sheet",
		});
		await expect(toggle).toBeVisible();

		// Should expand on click
		await toggle.click();
		await expect(
			page.getByRole("columnheader", { name: "Field" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "Range" }),
		).toBeVisible();
	});
});
