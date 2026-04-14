import { expect, test } from "@playwright/test";

test.describe("Strip Metadata Tool Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/image/strip-metadata");
	});

	test("should display tool heading", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("EXIF Metadata Remover");
	});

	test("should display file dropzone", async ({ page }) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});

	test("should display FAQ section", async ({ page }) => {
		await expect(
			page.getByText(
				"What is the history behind the EXIF standard embedded in photos?",
			),
		).toBeVisible();
		await expect(
			page.getByText(
				"How does Canvas re-encoding remove metadata from an image?",
			),
		).toBeVisible();
		await expect(
			page.getByText(
				"Which specific metadata fields does this tool strip from photos?",
			),
		).toBeVisible();
	});

	test("should have SEO meta description", async ({ page }) => {
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("Strip GPS");
		expect(description).toContain("metadata");
	});

	test("should have canonical link", async ({ page }) => {
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toContain("/image/strip-metadata");
	});

	test("should surface an error when a corrupt image is uploaded", async ({
		page,
	}) => {
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		// Create a file that *claims* to be a JPG (extension + mime) but whose
		// contents are random bytes — createImageBitmap will reject it.
		const input = page.locator(
			'input[type="file"][data-listener-ready="true"]',
		);
		await input.waitFor({ state: "attached", timeout: 10000 });
		await input.setInputFiles({
			name: "corrupt.jpg",
			mimeType: "image/jpeg",
			buffer: Buffer.from("not actually a jpeg"),
		});
		await page.evaluate(() => {
			const el = document.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
		});

		await expect(page.getByText("corrupt.jpg").first()).toBeVisible();
		// FileCard renders per-file errors with the text-destructive class
		await expect(page.locator(".text-destructive").first()).toBeVisible({
			timeout: 10000,
		});
	});
});
