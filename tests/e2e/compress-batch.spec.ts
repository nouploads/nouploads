import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Compress JPG — batch mode", () => {
	test("should compress multiple JPG files and show batch results", async ({
		page,
	}) => {
		await page.goto("/image/compress-jpg");
		await expect(page.getByText("Quality: 80%")).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, [
			join(fixtures, "sample.jpg"),
			join(fixtures, "sample.jpg"),
		]);

		// Wait for batch processing to finish — "Download all" button appears
		const downloadAllBtn = page.getByRole("button", {
			name: /download all/i,
		});
		await expect(downloadAllBtn).toBeVisible({ timeout: 15000 });

		// "Compress more" reset button is available
		await expect(
			page.getByRole("button", { name: /compress more/i }),
		).toBeVisible();
	});
});

test.describe("Compress PNG — batch mode", () => {
	test("should compress multiple PNG files and show batch results", async ({
		page,
	}) => {
		await page.goto("/image/compress-png");
		await expect(page.getByText(/Colors:/i)).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, [
			join(fixtures, "sample.png"),
			join(fixtures, "sample.png"),
		]);

		const downloadAllBtn = page.getByRole("button", {
			name: /download all/i,
		});
		await expect(downloadAllBtn).toBeVisible({ timeout: 30000 });
	});
});
