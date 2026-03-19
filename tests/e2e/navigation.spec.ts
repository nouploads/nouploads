import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
	test("should navigate to Image Compress tool from homepage", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByText("Image Compress").click();
		await expect(page).toHaveURL("/image/compress");
		await expect(page.locator("h1")).toContainText("Compress Images");
	});

	test("should navigate to Image Convert tool from homepage", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByText("Image Convert").click();
		await expect(page).toHaveURL("/image/convert");
		await expect(page.locator("h1")).toContainText("Convert Images");
	});

	test("should navigate to Color Picker from homepage", async ({ page }) => {
		await page.goto("/");

		await page.getByText("Color Picker").click();
		await expect(page).toHaveURL("/developer/color-picker");
		await expect(page.locator("h1")).toContainText("Color Picker");
	});

	test("should not navigate for coming-soon tools", async ({ page }) => {
		await page.goto("/");

		const resizeCard = page.getByText("Image Resize");
		await resizeCard.click();

		// Should still be on homepage
		await expect(page).toHaveURL("/");
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
