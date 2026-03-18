import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
	test("should navigate to HEIC to JPG tool from homepage", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByText("HEIC to JPG").click();
		await expect(page).toHaveURL("/image/heic-to-jpg");
		await expect(page.locator("h1")).toContainText("HEIC to JPG");
	});

	test("should not navigate for coming-soon tools", async ({ page }) => {
		await page.goto("/");

		const compressCard = page.getByText("Image Compress");
		await compressCard.click();

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
