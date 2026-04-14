import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Strip Metadata — upload and strip", () => {
	test("should strip metadata from a JPG and show download button", async ({
		page,
	}) => {
		await page.goto("/image/strip-metadata");
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		// File name should appear (may render twice — file card + list)
		await expect(page.getByText("sample.jpg").first()).toBeVisible();

		// Wait for processing to complete — "Clean" badge should appear
		await expect(page.getByText("Clean", { exact: true }).first()).toBeVisible({
			timeout: 15000,
		});

		// Download button should be visible
		const downloadButton = page
			.getByRole("button", { name: /download/i })
			.first();
		await expect(downloadButton).toBeVisible({ timeout: 5000 });
	});
});
