import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("SVG to JPG — upload and convert", () => {
	test("should convert SVG to JPG", async ({ page }) => {
		await page.goto("/image/svg-to-jpg");
		// Wait for lazy component to hydrate
		await expect(page.getByText("Output format:")).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.svg"));

		// Wait for download button
		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Result")).toBeVisible();
	});
});
