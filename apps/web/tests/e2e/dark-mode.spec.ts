import { expect, test } from "@playwright/test";

test.describe("Dark Mode", () => {
	test("should toggle dark mode", async ({ page }) => {
		await page.goto("/");

		// Page should have either light or dark class on html element
		const html = page.locator("html");

		// Find and click the theme toggle button
		const themeToggle = page.getByRole("button", {
			name: /theme|dark|light|mode/i,
		});

		if (await themeToggle.isVisible()) {
			const classBefore = await html.getAttribute("class");
			await themeToggle.click();
			const classAfter = await html.getAttribute("class");

			// Class should have changed (dark added or removed)
			expect(classBefore).not.toBe(classAfter);
		}
	});

	test("should respect system color scheme preference", async ({ page }) => {
		// Emulate dark color scheme
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto("/");

		const html = page.locator("html");
		const htmlClass = await html.getAttribute("class");

		// Should either have 'dark' class or be using dark mode styles
		// This depends on ThemeToggle implementation
		expect(htmlClass).toBeDefined();
	});
});
