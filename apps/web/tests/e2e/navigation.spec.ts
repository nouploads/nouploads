import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
	test("should navigate to Image Compress tool from homepage", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByRole("link", { name: "Image Compress" }).first().click();
		await expect(page).toHaveURL("/image/compress");
		await expect(page.locator("h1")).toContainText("Compress");
	});

	test("should navigate to Image Convert tool from homepage", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByRole("link", { name: "Image Convert" }).first().click();
		await expect(page).toHaveURL("/image/convert");
		await expect(page.locator("h1")).toContainText("Convert");
	});

	test("should navigate to Color Picker from homepage", async ({ page }) => {
		await page.goto("/");

		await page.getByRole("link", { name: "Color Picker" }).first().click();
		await expect(page).toHaveURL("/developer/color-picker");
		await expect(page.locator("h1")).toContainText("Color Picker");
	});

	test("should navigate to Image Resize tool from homepage", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByRole("link", { name: "Image Resize" }).first().click();
		await expect(page).toHaveURL("/image/resize");
		await expect(page.locator("h1")).toContainText("Resize");
	});

	test("should navigate to about page", async ({ page }) => {
		await page.goto("/");
		const aboutLink = page.getByRole("link", { name: /about/i });

		// Only test if about link exists in header/footer
		if (await aboutLink.isVisible()) {
			await aboutLink.click();
			await expect(page).toHaveURL("/about");
		}
	});
});
